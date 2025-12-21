import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ClipboardList,
  GraduationCap,
  Clock,
  Calendar,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useStudentAssessmentStore } from '@/stores/studentAssessmentStore';
import type { Assessment, AssessmentType } from '@/types';
import { cn } from '@/utils';

type TabFilter = 'pending' | 'completed' | 'all';

export default function AssignedAssessments() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    pendingAssessments,
    completedAssessments,
    assignedAssessments,
    isLoading,
    error,
    fetchAssignedAssessments,
    clearError,
  } = useStudentAssessmentStore();

  const [activeTab, setActiveTab] = useState<TabFilter>('pending');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchAssignedAssessments();
  }, [isAuthenticated, navigate, fetchAssignedAssessments]);

  const getTypeIcon = (type: AssessmentType) => {
    switch (type) {
      case 'quiz':
        return FileText;
      case 'homework':
        return ClipboardList;
      case 'mock_exam':
        return GraduationCap;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: AssessmentType) => {
    switch (type) {
      case 'quiz':
        return 'bg-blue-100 text-blue-600';
      case 'homework':
        return 'bg-amber-100 text-amber-600';
      case 'mock_exam':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', urgent: true };
    if (diffDays === 0) return { text: 'Due today', urgent: true };
    if (diffDays === 1) return { text: 'Due tomorrow', urgent: true };
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, urgent: false };
    return {
      text: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      urgent: false,
    };
  };

  const getDisplayedAssessments = () => {
    switch (activeTab) {
      case 'pending':
        return pendingAssessments;
      case 'completed':
        return completedAssessments;
      case 'all':
        return assignedAssessments;
      default:
        return pendingAssessments;
    }
  };

  const displayedAssessments = getDisplayedAssessments();

  const handleStartAssessment = (assessment: Assessment) => {
    navigate(`/assessments/${assessment.id}/take`);
  };

  const handleViewResults = (assessment: Assessment) => {
    navigate(`/assessments/${assessment.id}/results`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">My Assessments</h1>
              <p className="text-neutral-600">Quizzes, homework & exams assigned to you</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {pendingAssessments.length}
                </p>
                <p className="text-sm text-neutral-500">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {completedAssessments.length}
                </p>
                <p className="text-sm text-neutral-500">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'pending'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            )}
          >
            Pending ({pendingAssessments.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'completed'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            )}
          >
            Completed ({completedAssessments.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            )}
          >
            All ({assignedAssessments.length})
          </button>

          <button
            onClick={() => fetchAssignedAssessments()}
            disabled={isLoading}
            className="ml-auto p-2 text-neutral-500 hover:text-neutral-700"
          >
            <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Assessment List */}
        {isLoading && displayedAssessments.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : displayedAssessments.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {activeTab === 'pending'
                ? 'No pending assessments'
                : activeTab === 'completed'
                ? 'No completed assessments'
                : 'No assessments assigned'}
            </h3>
            <p className="text-neutral-500">
              {activeTab === 'pending'
                ? "You're all caught up!"
                : activeTab === 'completed'
                ? 'Complete some assessments to see them here'
                : 'Check back later for new assignments'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedAssessments.map((assessment) => {
              const TypeIcon = getTypeIcon(assessment.assessmentType);
              const dueInfo = formatDate(assessment.endDate);
              const isCompleted = completedAssessments.some((a) => a.id === assessment.id);

              return (
                <div
                  key={assessment.id}
                  className={cn(
                    'bg-white rounded-xl border p-5 transition-all',
                    isCompleted
                      ? 'border-neutral-200'
                      : 'border-neutral-200 hover:border-indigo-300 hover:shadow-md cursor-pointer'
                  )}
                  onClick={() =>
                    isCompleted
                      ? handleViewResults(assessment)
                      : handleStartAssessment(assessment)
                  }
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        getTypeColor(assessment.assessmentType)
                      )}
                    >
                      <TypeIcon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-neutral-900">
                            {assessment.title}
                          </h3>
                          <p className="text-sm text-neutral-500 capitalize mt-0.5">
                            {assessment.assessmentType.replace('_', ' ')}
                          </p>
                        </div>

                        {isCompleted ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Completed
                          </span>
                        ) : (
                          <ChevronRight className="w-5 h-5 text-neutral-400" />
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-neutral-500">
                          <FileText className="w-4 h-4" />
                          {assessment.questionCount || 0} questions
                        </span>

                        {assessment.timeLimit && (
                          <span className="flex items-center gap-1 text-neutral-500">
                            <Clock className="w-4 h-4" />
                            {assessment.timeLimit} min
                          </span>
                        )}

                        {dueInfo && !isCompleted && (
                          <span
                            className={cn(
                              'flex items-center gap-1',
                              dueInfo.urgent ? 'text-red-600' : 'text-neutral-500'
                            )}
                          >
                            <Calendar className="w-4 h-4" />
                            {dueInfo.text}
                          </span>
                        )}
                      </div>

                      {assessment.description && (
                        <p className="text-sm text-neutral-500 mt-2 line-clamp-2">
                          {assessment.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
