import { useState } from 'react';
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
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/common';
import { useExamStore } from '@/stores';
import { cn } from '@/utils';

// Mock exam configurations per exam type
const mockExamConfigs = {
  wassce: {
    title: 'WASSCE Mock Exams',
    description: 'Full-length timed practice exams following WAEC format',
    exams: [
      {
        id: 'mock_wassce_core_math',
        name: 'Core Mathematics',
        subject: 'Core Mathematics',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 90, marks: 50, format: 'Objectives' },
          { type: 'Paper 2', questions: 13, duration: 180, marks: 100, format: 'Essay/Theory' },
        ],
        difficulty: 'Standard',
        color: '#8B5CF6',
      },
      {
        id: 'mock_wassce_english',
        name: 'English Language',
        subject: 'English Language',
        papers: [
          { type: 'Paper 1', questions: 80, duration: 60, marks: 80, format: 'Objectives' },
          { type: 'Paper 2', questions: 5, duration: 150, marks: 100, format: 'Essay' },
          { type: 'Paper 3', questions: 60, duration: 60, marks: 60, format: 'Test of Orals' },
        ],
        difficulty: 'Standard',
        color: '#3B82F6',
      },
      {
        id: 'mock_wassce_int_science',
        name: 'Integrated Science',
        subject: 'Integrated Science',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives' },
          { type: 'Paper 2', questions: 6, duration: 120, marks: 60, format: 'Essay' },
        ],
        difficulty: 'Standard',
        color: '#10B981',
      },
      {
        id: 'mock_wassce_social',
        name: 'Social Studies',
        subject: 'Social Studies',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives' },
          { type: 'Paper 2', questions: 4, duration: 120, marks: 50, format: 'Essay' },
        ],
        difficulty: 'Standard',
        color: '#F59E0B',
      },
      {
        id: 'mock_wassce_physics',
        name: 'Physics',
        subject: 'Physics',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives' },
          { type: 'Paper 2', questions: 10, duration: 180, marks: 80, format: 'Essay/Structured' },
          { type: 'Paper 3', questions: 4, duration: 180, marks: 50, format: 'Practical' },
        ],
        difficulty: 'Advanced',
        color: '#8B5CF6',
      },
      {
        id: 'mock_wassce_chemistry',
        name: 'Chemistry',
        subject: 'Chemistry',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 60, marks: 50, format: 'Objectives' },
          { type: 'Paper 2', questions: 8, duration: 180, marks: 100, format: 'Essay/Structured' },
          { type: 'Paper 3', questions: 3, duration: 180, marks: 50, format: 'Practical' },
        ],
        difficulty: 'Advanced',
        color: '#10B981',
      },
      {
        id: 'mock_wassce_biology',
        name: 'Biology',
        subject: 'Biology',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 50, marks: 50, format: 'Objectives' },
          { type: 'Paper 2', questions: 8, duration: 180, marks: 100, format: 'Essay/Structured' },
          { type: 'Paper 3', questions: 4, duration: 180, marks: 50, format: 'Practical' },
        ],
        difficulty: 'Advanced',
        color: '#22C55E',
      },
      {
        id: 'mock_wassce_elective_math',
        name: 'Elective Mathematics',
        subject: 'Elective Mathematics',
        papers: [
          { type: 'Paper 1', questions: 50, duration: 90, marks: 50, format: 'Objectives' },
          { type: 'Paper 2', questions: 10, duration: 180, marks: 100, format: 'Essay/Structured' },
        ],
        difficulty: 'Advanced',
        color: '#6366F1',
      },
    ],
  },
  bece: {
    title: 'BECE Mock Exams',
    description: 'Full-length timed practice exams following BECE format',
    exams: [
      {
        id: 'mock_bece_math',
        name: 'Mathematics',
        subject: 'Mathematics',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 60, marks: 40, format: 'Objectives' },
          { type: 'Paper 2', questions: 5, duration: 90, marks: 60, format: 'Essay' },
        ],
        difficulty: 'Standard',
        color: '#8B5CF6',
      },
      {
        id: 'mock_bece_english',
        name: 'English Language',
        subject: 'English Language',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives' },
          { type: 'Paper 2', questions: 4, duration: 120, marks: 60, format: 'Essay/Composition' },
        ],
        difficulty: 'Standard',
        color: '#3B82F6',
      },
      {
        id: 'mock_bece_science',
        name: 'Integrated Science',
        subject: 'Integrated Science',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives' },
          { type: 'Paper 2', questions: 5, duration: 90, marks: 60, format: 'Essay' },
        ],
        difficulty: 'Standard',
        color: '#10B981',
      },
      {
        id: 'mock_bece_social',
        name: 'Social Studies',
        subject: 'Social Studies',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives' },
          { type: 'Paper 2', questions: 4, duration: 90, marks: 60, format: 'Essay' },
        ],
        difficulty: 'Standard',
        color: '#F59E0B',
      },
      {
        id: 'mock_bece_rme',
        name: 'RME',
        subject: 'Religious & Moral Education',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives' },
          { type: 'Paper 2', questions: 4, duration: 75, marks: 60, format: 'Essay' },
        ],
        difficulty: 'Standard',
        color: '#A855F7',
      },
      {
        id: 'mock_bece_ict',
        name: 'ICT',
        subject: 'Information & Communication Technology',
        papers: [
          { type: 'Paper 1', questions: 40, duration: 45, marks: 40, format: 'Objectives' },
          { type: 'Paper 2', questions: 3, duration: 60, marks: 60, format: 'Practical' },
        ],
        difficulty: 'Standard',
        color: '#06B6D4',
      },
    ],
  },
  nsmq: {
    title: 'NSMQ Practice Exams',
    description: 'Simulated NSMQ rounds and competition practice',
    exams: [
      {
        id: 'mock_nsmq_full',
        name: 'Full Competition Simulation',
        subject: 'All Subjects',
        papers: [
          { type: 'Round 1', questions: 15, duration: 30, marks: 45, format: 'Fundamentals' },
          { type: 'Round 2', questions: 20, duration: 20, marks: 60, format: 'Speed Race' },
          { type: 'Round 3', questions: 4, duration: 30, marks: 40, format: 'Problem of the Day' },
          { type: 'Round 4', questions: 12, duration: 12, marks: 24, format: 'True/False' },
          { type: 'Round 5', questions: 4, duration: 20, marks: 20, format: 'Riddles' },
        ],
        difficulty: 'Competition',
        color: '#FFD700',
      },
      {
        id: 'mock_nsmq_math',
        name: 'Mathematics Focus',
        subject: 'Mathematics',
        papers: [
          { type: 'Mixed', questions: 30, duration: 45, marks: 90, format: 'All Rounds' },
        ],
        difficulty: 'Advanced',
        color: '#8B5CF6',
      },
      {
        id: 'mock_nsmq_physics',
        name: 'Physics Focus',
        subject: 'Physics',
        papers: [
          { type: 'Mixed', questions: 30, duration: 45, marks: 90, format: 'All Rounds' },
        ],
        difficulty: 'Advanced',
        color: '#3B82F6',
      },
      {
        id: 'mock_nsmq_chemistry',
        name: 'Chemistry Focus',
        subject: 'Chemistry',
        papers: [
          { type: 'Mixed', questions: 30, duration: 45, marks: 90, format: 'All Rounds' },
        ],
        difficulty: 'Advanced',
        color: '#10B981',
      },
      {
        id: 'mock_nsmq_biology',
        name: 'Biology Focus',
        subject: 'Biology',
        papers: [
          { type: 'Mixed', questions: 30, duration: 45, marks: 90, format: 'All Rounds' },
        ],
        difficulty: 'Advanced',
        color: '#22C55E',
      },
    ],
  },
};

// User's exam history - will be populated from API/store with real data
const mockExamHistory: {
  id: string;
  examId: string;
  examName: string;
  paper: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  duration: number;
}[] = [];

type TabType = 'available' | 'history' | 'scheduled';

export function MockExamsPage() {
  const navigate = useNavigate();
  const { currentExamType } = useExamStore();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  const config = mockExamConfigs[currentExamType];

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

  const handleStartExam = (examId: string, paperType?: string) => {
    // Navigate to exam session (you would implement this page)
    navigate(`/mock-exams/${examId}${paperType ? `?paper=${encodeURIComponent(paperType)}` : ''}`);
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
                  <p className="text-2xl font-bold text-neutral-900">{mockExamHistory.length}</p>
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
                    {mockExamHistory.length > 0
                      ? Math.round(mockExamHistory.reduce((s, h) => s + h.percentage, 0) / mockExamHistory.length)
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
                    {mockExamHistory.length > 0 ? Math.max(...mockExamHistory.map(h => h.percentage)) : 0}%
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
                              handleStartExam(exam.id, paper.type);
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
          {mockExamHistory.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-700 mb-2">No exam history yet</h3>
              <p className="text-neutral-500 mb-4">Complete a mock exam to see your results here</p>
              <Button onClick={() => setActiveTab('available')}>
                Browse Exams
              </Button>
            </Card>
          ) : (
            mockExamHistory.map((attempt) => (
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
                    <p className="text-2xl font-bold text-neutral-900">{attempt.percentage}%</p>
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
