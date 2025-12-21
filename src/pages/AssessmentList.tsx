import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  X,
  Loader2,
  FileText,
  ClipboardList,
  GraduationCap,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Users,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAssessmentStore } from '@/stores/assessmentStore';
import type { Assessment, AssessmentType, AssessmentStatus } from '@/types';
import { ConfirmModal } from '@/components/common/Modal';
import { cn } from '@/utils';

type StatusFilter = AssessmentStatus | 'all';
type TypeFilter = AssessmentType | 'all';

export default function AssessmentList() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    assessments,
    isLoading,
    error,
    fetchAssessments,
    deleteAssessment,
    duplicateAssessment,
    archiveAssessment,
    clearError,
  } = useAssessmentStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Assessment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (!isTeacher) {
      navigate('/dashboard');
      return;
    }
    fetchAssessments();
  }, [isAuthenticated, isTeacher, navigate, fetchAssessments]);

  // Filter assessments
  const filteredAssessments = assessments.filter((a) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!a.title.toLowerCase().includes(query)) return false;
    }
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (typeFilter !== 'all' && a.assessmentType !== typeFilter) return false;
    return true;
  });

  // Stats
  const stats = {
    total: assessments.length,
    draft: assessments.filter((a) => a.status === 'draft').length,
    published: assessments.filter((a) => a.status === 'published').length,
    archived: assessments.filter((a) => a.status === 'archived').length,
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteAssessment(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (assessment: Assessment) => {
    try {
      await duplicateAssessment(assessment.id);
      setOpenMenu(null);
    } catch (error) {
      console.error('Failed to duplicate:', error);
    }
  };

  const handleArchive = async (assessment: Assessment) => {
    try {
      await archiveAssessment(assessment.id);
      setOpenMenu(null);
    } catch (error) {
      console.error('Failed to archive:', error);
    }
  };

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
        return 'bg-blue-100 text-blue-700';
      case 'homework':
        return 'bg-amber-100 text-amber-700';
      case 'mock_exam':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusBadge = (status: AssessmentStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
            <Edit className="w-3 h-3" />
            Draft
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Published
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full text-xs font-medium">
            <Archive className="w-3 h-3" />
            Archived
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (!isTeacher) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Assessments</h1>
                <p className="text-neutral-600">Manage your quizzes, homework & exams</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/teacher/assessments/new?type=quiz')}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Quick Create Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => navigate('/teacher/assessments/new?type=quiz')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Quick Quiz
          </button>
          <button
            onClick={() => navigate('/teacher/assessments/new?type=homework')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Homework
          </button>
          <button
            onClick={() => navigate('/teacher/assessments/new?type=mock_exam')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            Mock Exam
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
            <p className="text-sm text-neutral-500">Total Assessments</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <p className="text-2xl font-bold text-neutral-900">{stats.draft}</p>
            <p className="text-sm text-neutral-500">Drafts</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            <p className="text-sm text-neutral-500">Published</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <p className="text-2xl font-bold text-neutral-400">{stats.archived}</p>
            <p className="text-sm text-neutral-500">Archived</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-neutral-200 mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="pl-4 pr-8 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white min-w-[130px]"
              >
                <option value="all">All Status</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="pl-4 pr-8 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-white min-w-[130px]"
              >
                <option value="all">All Types</option>
                <option value="quiz">Quizzes</option>
                <option value="homework">Homework</option>
                <option value="mock_exam">Mock Exams</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            <button
              onClick={() => fetchAssessments()}
              disabled={isLoading}
              className="p-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Assessment List */}
        {isLoading && assessments.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No assessments found'
                : 'No assessments yet'}
            </h3>
            <p className="text-neutral-500 mb-6">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first quiz, homework, or exam'}
            </p>
            {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
              <button
                onClick={() => navigate('/teacher/assessments/new')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Assessment
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssessments.map((assessment) => {
              const TypeIcon = getTypeIcon(assessment.assessmentType);
              return (
                <div
                  key={assessment.id}
                  className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow"
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
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {getStatusBadge(assessment.status)}
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                                getTypeColor(assessment.assessmentType)
                              )}
                            >
                              {assessment.assessmentType.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setOpenMenu(openMenu === assessment.id ? null : assessment.id)
                            }
                            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openMenu === assessment.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenu(null)}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20">
                                <button
                                  onClick={() => {
                                    navigate(`/teacher/assessments/${assessment.id}/edit`);
                                    setOpenMenu(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDuplicate(assessment)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                                >
                                  <Copy className="w-4 h-4" />
                                  Duplicate
                                </button>
                                {assessment.status === 'published' && (
                                  <button
                                    onClick={() => handleArchive(assessment)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                                  >
                                    <Archive className="w-4 h-4" />
                                    Archive
                                  </button>
                                )}
                                <hr className="my-1" />
                                <button
                                  onClick={() => {
                                    setShowDeleteConfirm(assessment);
                                    setOpenMenu(null);
                                  }}
                                  disabled={assessment.status === 'published'}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {assessment.questionCount || 0} questions
                        </span>
                        {assessment.timeLimit && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {assessment.timeLimit} min
                          </span>
                        )}
                        {assessment.endDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due {formatDate(assessment.endDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results count */}
        {filteredAssessments.length > 0 && (
          <div className="mt-6 text-sm text-neutral-600 text-center">
            Showing {filteredAssessments.length} of {assessments.length} assessments
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Assessment"
        message={`Are you sure you want to delete "${showDeleteConfirm?.title}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
