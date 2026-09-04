import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  FileText,
  Play,
  Calendar,
  Target,
  Trophy,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Timer,
  BookOpen,
  Star,
  Loader2,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';
import { useExamStore } from '@/stores/examStore';
import { cn } from '@/utils';
import { api } from '@/lib/api';
import type { GhanaExamTypeSlug, ExamTypeSlug } from '@/types';
import { isGhanaExam } from '@/types';

// Mock exam paper type
interface MockExamPaper {
  type: string;
  questions: number;
  duration: number;
  marks: number;
  format: string;
  paperId: string;
}

// Mock exam type
interface MockExam {
  id: string;
  name: string;
  subject: string;
  papers: MockExamPaper[];
  difficulty: string;
  color: string;
}

// Mock exam config type
interface MockExamConfig {
  title: string;
  description: string;
  exams: MockExam[];
}

// Mock exam configurations per exam type
// Each paper entry maps to an actual paper ID in the database; core WASSCE
// subjects carry both Paper 1 (objectives) and Paper 2 (theory, AI-marked).
const mockExamConfigs: Record<GhanaExamTypeSlug, MockExamConfig> = {
  wassce: {
    title: 'WASSCE Mock Exams',
    description: 'Full-length timed practice exams following WAEC format',
    exams: [
      {
        id: 'pp_wassce_math_2024_1', // Maps to actual database paper
        name: 'Core Mathematics',
        subject: 'Core Mathematics',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 90, marks: 50, format: 'Objectives', paperId: 'pp_wassce_math_2024_1' },
          { type: 'Paper 2', questions: 10, duration: 150, marks: 115, format: 'Theory', paperId: 'pp_wassce_math_2024_2' },
        ],
        difficulty: 'Standard',
        color: '#8B5CF6',
      },
      {
        id: 'pp_wassce_eng_2024_1',
        name: 'English Language',
        subject: 'English Language',
        papers: [
          { type: 'Paper 1', questions: 80, duration: 60, marks: 80, format: 'Objectives', paperId: 'pp_wassce_eng_2024_1' },
          { type: 'Paper 2', questions: 8, duration: 120, marks: 300, format: 'Theory', paperId: 'pp_wassce_eng_2024_2' },
        ],
        difficulty: 'Standard',
        color: '#3B82F6',
      },
      {
        id: 'pp_wassce_sci_2024_1',
        name: 'Integrated Science',
        subject: 'Integrated Science',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives', paperId: 'pp_wassce_sci_2024_1' },
          { type: 'Paper 2', questions: 8, duration: 105, marks: 100, format: 'Theory', paperId: 'pp_wassce_sci_2024_2' },
        ],
        difficulty: 'Standard',
        color: '#10B981',
      },
      {
        id: 'pp_wassce_soc_2024_1',
        name: 'Social Studies',
        subject: 'Social Studies',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives', paperId: 'pp_wassce_soc_2024_1' },
          { type: 'Paper 2', questions: 9, duration: 120, marks: 180, format: 'Theory', paperId: 'pp_wassce_soc_2024_2' },
        ],
        difficulty: 'Standard',
        color: '#F59E0B',
      },
      {
        id: 'pp_wassce_phy_2024_1',
        name: 'Physics',
        subject: 'Physics',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives', paperId: 'pp_wassce_phy_2024_1' },
        ],
        difficulty: 'Advanced',
        color: '#8B5CF6',
      },
      {
        id: 'pp_wassce_chem_2024_1',
        name: 'Chemistry',
        subject: 'Chemistry',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives', paperId: 'pp_wassce_chem_2024_1' },
        ],
        difficulty: 'Advanced',
        color: '#10B981',
      },
      {
        id: 'pp_wassce_bio_2024_1',
        name: 'Biology',
        subject: 'Biology',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 50, marks: 50, format: 'Objectives', paperId: 'pp_wassce_bio_2024_1' },
        ],
        difficulty: 'Advanced',
        color: '#22C55E',
      },
      {
        id: 'pp_wassce_emath_2024_1',
        name: 'Elective Mathematics',
        subject: 'Elective Mathematics',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 60, marks: 40, format: 'Objectives', paperId: 'pp_wassce_emath_2024_1' },
        ],
        difficulty: 'Advanced',
        color: '#6366F1',
      },
      {
        id: 'pp_wassce_eco_2024_1',
        name: 'Economics',
        subject: 'Economics',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives', paperId: 'pp_wassce_eco_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#10B981',
      },
      {
        id: 'pp_wassce_gov_2024_1',
        name: 'Government',
        subject: 'Government',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives', paperId: 'pp_wassce_gov_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#3B82F6',
      },
      {
        id: 'pp_wassce_geo_2024_1',
        name: 'Geography',
        subject: 'Geography',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives', paperId: 'pp_wassce_geo_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#F97316',
      },
      {
        id: 'pp_wassce_lit_2024_1',
        name: 'Literature in English',
        subject: 'Literature in English',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives', paperId: 'pp_wassce_lit_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#A855F7',
      },
      {
        id: 'pp_wassce_acc_2024_1',
        name: 'Financial Accounting',
        subject: 'Financial Accounting',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives', paperId: 'pp_wassce_acc_2024_1' },
        ],
        difficulty: 'Advanced',
        color: '#14B8A6',
      },
      {
        id: 'pp_wassce_crs_2024_1',
        name: 'Christian Religious Studies',
        subject: 'CRS',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives', paperId: 'pp_wassce_crs_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#EC4899',
      },
    ],
  },
  bece: {
    title: 'BECE Mock Exams',
    description: 'Full-length timed practice exams following BECE format',
    exams: [
      {
        id: 'pp_bece_math_2024_1',
        name: 'Mathematics',
        subject: 'Mathematics',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 60, marks: 40, format: 'Objectives', paperId: 'pp_bece_math_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#8B5CF6',
      },
      {
        id: 'pp_bece_eng_2024_1',
        name: 'English Language',
        subject: 'English Language',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives', paperId: 'pp_bece_eng_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#3B82F6',
      },
      {
        id: 'pp_bece_sci_2024_1',
        name: 'Integrated Science',
        subject: 'Integrated Science',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives', paperId: 'pp_bece_sci_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#10B981',
      },
      {
        id: 'pp_bece_soc_2024_1',
        name: 'Social Studies',
        subject: 'Social Studies',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives', paperId: 'pp_bece_soc_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#F59E0B',
      },
      {
        id: 'pp_bece_rme_2024_1',
        name: 'Religious & Moral Education',
        subject: 'RME',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives', paperId: 'pp_bece_rme_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#EC4899',
      },
      {
        id: 'pp_bece_ict_2024_1',
        name: 'ICT',
        subject: 'ICT',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives', paperId: 'pp_bece_ict_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#6366F1',
      },
      {
        id: 'pp_bece_french_2024_1',
        name: 'French',
        subject: 'French',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives', paperId: 'pp_bece_french_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#F59E0B',
      },
      {
        id: 'pp_bece_bdt_2024_1',
        name: 'Basic Design & Technology',
        subject: 'BDT',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives', paperId: 'pp_bece_bdt_2024_1' },
        ],
        difficulty: 'Standard',
        color: '#8B5CF6',
      },
    ],
  },
  nsmq: {
    title: 'NSMQ Practice Exams',
    description: 'Simulated NSMQ rounds and competition practice',
    exams: [
      {
        id: 'pp_wassce_math_2024_1',
        name: 'Mathematics Focus',
        subject: 'Mathematics',
        papers: [
          { type: 'Practice', questions: 50, duration: 90, marks: 50, format: 'Mixed Questions', paperId: 'pp_wassce_math_2024_1' },
        ],
        difficulty: 'Advanced',
        color: '#8B5CF6',
      },
      {
        id: 'pp_wassce_phy_2024_1',
        name: 'Physics Focus',
        subject: 'Physics',
        papers: [
          { type: 'Practice', questions: 50, duration: 60, marks: 50, format: 'Mixed Questions', paperId: 'pp_wassce_phy_2024_1' },
        ],
        difficulty: 'Advanced',
        color: '#3B82F6',
      },
      {
        id: 'pp_wassce_chem_2024_1',
        name: 'Chemistry Focus',
        subject: 'Chemistry',
        papers: [
          { type: 'Practice', questions: 50, duration: 60, marks: 50, format: 'Mixed Questions', paperId: 'pp_wassce_chem_2024_1' },
        ],
        difficulty: 'Advanced',
        color: '#10B981',
      },
      {
        id: 'pp_wassce_bio_2024_1',
        name: 'Biology Focus',
        subject: 'Biology',
        papers: [
          { type: 'Practice', questions: 50, duration: 50, marks: 50, format: 'Mixed Questions', paperId: 'pp_wassce_bio_2024_1' },
        ],
        difficulty: 'Advanced',
        color: '#22C55E',
      },
    ],
  },
};

// Exam history type
interface ExamHistoryItem {
  id: string;
  examId: string;
  examName: string;
  paper: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  duration: number;
}

type TabType = 'available' | 'history' | 'scheduled';

export function MockExamsPage() {
  const navigate = useNavigate();
  const { currentExamType } = useExamStore();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch exam history on mount
  useEffect(() => {
    const fetchExamHistory = async () => {
      setHistoryLoading(true);
      try {
        // Fetch paper attempts from API
        const res = await api.get<Array<{
          id: string;
          paper_id: string;
          status: string;
          total_score: number;
          max_score: number;
          percentage: number;
          time_used: number;
          submitted_at: string;
          paper?: { title: string; paper_type: string };
        }>>('/papers/attempts?limit=20');
        const data = res.success ? res.data : null;

        if (data && Array.isArray(data)) {
          // Transform API response to our format
          const history: ExamHistoryItem[] = data
            .filter(attempt => attempt.status === 'completed' || attempt.status === 'graded' || attempt.status === 'partially_graded')
            .map(attempt => ({
              id: attempt.id,
              examId: attempt.paper_id,
              examName: attempt.paper?.title || 'Mock Exam',
              paper: attempt.paper?.paper_type || 'Paper 1',
              score: attempt.total_score || 0,
              maxScore: attempt.max_score || 100,
              percentage: attempt.percentage || 0,
              completedAt: attempt.submitted_at,
              duration: attempt.time_used || 0,
            }));
          setExamHistory(history);
        }
      } catch (err) {
        console.error('Failed to fetch exam history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchExamHistory();
  }, []);

  // Get config for current exam type
  const getConfigForExamType = (examType: ExamTypeSlug): MockExamConfig => {
    if (isGhanaExam(examType)) {
      return mockExamConfigs[examType];
    }
    // IGCSE / Cambridge A-Level mock configs were removed: their paper IDs
    // do not exist in the DB (404). Re-add with real papers only —
    // scripts/verify-mock-configs.cjs enforces this in db:verify.
    return mockExamConfigs.wassce; // Ultimate fallback
  };

  const config = getConfigForExamType(currentExamType);

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const getTotalDuration = (papers: { duration: number }[]) => {
    return papers.reduce((sum, p) => sum + p.duration, 0);
  };

  const getTotalMarks = (papers: { marks: number }[]) => {
    return papers.reduce((sum, p) => sum + p.marks, 0);
  };

  const handleStartExam = (paperId: string) => {
    // Navigate to exam session using the actual paper ID from the database
    navigate(`/mock-exams/${paperId}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-teal-100">
            <ClipboardList className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{config.title}</h1>
            <p className="text-neutral-600">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-200">
        {[
          { id: 'available', label: 'Available Exams', icon: BookOpen },
          { id: 'history', label: 'My History', icon: Clock },
          { id: 'scheduled', label: 'Scheduled', icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Available Exams Tab */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500 text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-700">{config.exams.length}</p>
                  <p className="text-sm text-teal-600">Mock Exams</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{examHistory.length}</p>
                  <p className="text-sm text-neutral-500">Completed</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {examHistory.length > 0
                      ? Math.round(examHistory.reduce((s, h) => s + h.percentage, 0) / examHistory.length)
                      : 0}%
                  </p>
                  <p className="text-sm text-neutral-500">Avg Score</p>
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
                    {examHistory.length > 0 ? Math.round(Math.max(...examHistory.map(h => h.percentage))) : 0}%
                  </p>
                  <p className="text-sm text-neutral-500">Best Score</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Exam List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {config.exams.map((exam) => (
              <Card
                key={exam.id}
                className={cn(
                  'p-5 cursor-pointer transition-all',
                  selectedExam === exam.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                )}
                onClick={() => setSelectedExam(selectedExam === exam.id ? null : exam.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${exam.color}20` }}
                    >
                      <BookOpen className="w-6 h-6" style={{ color: exam.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{exam.name}</h3>
                      <p className="text-sm text-neutral-500">{exam.subject}</p>
                    </div>
                  </div>
                  <Badge
                    variant={exam.difficulty === 'Advanced' ? 'accent' : 'secondary'}
                  >
                    {exam.difficulty}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-neutral-600 mb-4">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {exam.papers.length} Paper{exam.papers.length > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(getTotalDuration(exam.papers))}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {getTotalMarks(exam.papers)} marks
                  </span>
                </div>

                {/* Expanded Paper Details */}
                {selectedExam === exam.id && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3 animate-in slide-in-from-top-2">
                    {exam.papers.map((paper, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-neutral-800">{paper.type}</p>
                          <p className="text-xs text-neutral-500">
                            {paper.questions} questions | {paper.format} | {paper.marks} marks
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-neutral-500 flex items-center gap-1">
                            <Timer className="w-4 h-4" />
                            {formatDuration(paper.duration)}
                          </span>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartExam((paper as { paperId?: string }).paperId || exam.id);
                            }}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      className="w-full mt-2"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartExam(exam.id);
                      }}
                    >
                      Start Full Exam
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : examHistory.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-700 mb-2">No exam history yet</h3>
              <p className="text-neutral-500 mb-4">Complete a mock exam to see your results here</p>
              <Button onClick={() => setActiveTab('available')}>
                Browse Exams
              </Button>
            </Card>
          ) : (
            examHistory.map((attempt) => (
              <Card key={attempt.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      attempt.percentage >= 70 ? 'bg-emerald-100' : attempt.percentage >= 50 ? 'bg-amber-100' : 'bg-red-100'
                    )}>
                      {attempt.percentage >= 70 ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <AlertCircle className={cn(
                          'w-6 h-6',
                          attempt.percentage >= 50 ? 'text-amber-600' : 'text-red-600'
                        )} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{attempt.examName}</h3>
                      <p className="text-sm text-neutral-500">
                        {attempt.paper} | {new Date(attempt.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900">{Math.round(attempt.percentage)}%</p>
                    <p className="text-sm text-neutral-500">
                      {attempt.score}/{attempt.maxScore} marks
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === 'scheduled' && (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-700 mb-2">No scheduled exams</h3>
          <p className="text-neutral-500 mb-4">
            Schedule mock exams to practice at specific times
          </p>
          <Button onClick={() => setActiveTab('available')}>
            Schedule an Exam
          </Button>
        </Card>
      )}
    </div>
  );
}
