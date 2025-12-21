import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  ChevronDown,
  X,
  Loader2,
  ClipboardCheck,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useGradingStore } from '@/stores/gradingStore';
import type { AssessmentAttempt, AssessmentGradingStatus } from '@/types';
import { GradingPanel } from '@/components/grading';
import { cn } from '@/utils';

type StatusFilter = AssessmentGradingStatus | 'all';

export default function AssessmentGrading() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    gradingQueue,
    queueTotal,
    pendingCount,
    partialCount,
    completedTodayCount,
    currentAttempt,
    isLoading,
    error,
    fetchGradingQueue,
    loadAttemptForGrading,
    clearError,
    reset,
  } = useGradingStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showGradingPanel, setShowGradingPanel] = useState(false);

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
    fetchGradingQueue();
  }, [isAuthenticated, isTeacher, navigate, fetchGradingQueue]);

  // Filter attempts
  const filteredAttempts = gradingQueue.filter((a) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        a.student?.name.toLowerCase().includes(query) ||
        a.assessment?.title.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (statusFilter !== 'all' && a.gradingStatus !== statusFilter) return false;
    return true;
  });

  const handleSelectAttempt = async (attempt: AssessmentAttempt) => {
    await loadAttemptForGrading(attempt.id);
    setShowGradingPanel(true);
  };

  const handleCloseGradingPanel = () => {
    setShowGradingPanel(false);
    reset();
    fetchGradingQueue();
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getStatusBadge = (status: AssessmentGradingStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Pending
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'complete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Complete
          </span>
        );
      default:
        return null;
    }
  };

  if (!isTeacher) return null;

  // Show grading panel if an attempt is selected
  if (showGradingPanel && currentAttempt) {
    return <GradingPanel onClose={handleCloseGradingPanel} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Grading Queue</h1>
              <p className="text-neutral-600">Review and grade student submissions</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{pendingCount}</p>
                <p className="text-sm text-neutral-500">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{partialCount}</p>
                <p className="text-sm text-neutral-500">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{completedTodayCount}</p>
                <p className="text-sm text-neutral-500">Graded Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{queueTotal}</p>
                <p className="text-sm text-neutral-500">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-neutral-200 mb-6">
          <div className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by student or assessment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
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
                className="pl-4 pr-8 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none bg-white min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="partial">In Progress</option>
                <option value="complete">Complete</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            <button
              onClick={() => fetchGradingQueue()}
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

        {/* Queue List */}
        {isLoading && gradingQueue.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {searchQuery || statusFilter !== 'all'
                ? 'No submissions found'
                : 'No submissions to grade'}
            </h3>
            <p className="text-neutral-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAttempts.map((attempt) => (
              <button
                key={attempt.id}
                onClick={() => handleSelectAttempt(attempt)}
                className="w-full bg-white rounded-xl border border-neutral-200 p-5 hover:border-purple-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  {/* Student Avatar */}
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          {attempt.student?.name || 'Unknown Student'}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          {attempt.assessment?.title || 'Assessment'}
                        </p>
                      </div>
                      {getStatusBadge(attempt.gradingStatus)}
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                      <span>Submitted {formatDate(attempt.submittedAt)}</span>
                      <span>
                        Score: {attempt.autoScore + (attempt.manualScore || 0)}/
                        {attempt.maxScore}
                      </span>
                      {attempt.isLate && (
                        <span className="text-red-600">Late submission</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {filteredAttempts.length > 0 && (
          <div className="mt-6 text-sm text-neutral-600 text-center">
            Showing {filteredAttempts.length} of {queueTotal} submissions
          </div>
        )}
      </div>
    </div>
  );
}
