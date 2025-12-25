import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Video,
  MessageCircle,
  PenTool,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useTutoringStore } from '@/stores/tutoringStore';
import type { TutoringRequest, SessionType } from '@/types/tutoring';

const sessionTypeConfig: Record<SessionType, { icon: React.ReactNode; label: string }> = {
  video: { icon: <Video className="w-4 h-4" />, label: 'Video Call' },
  chat: { icon: <MessageCircle className="w-4 h-4" />, label: 'Chat' },
  whiteboard: { icon: <PenTool className="w-4 h-4" />, label: 'Whiteboard' },
};

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  pending: { icon: <Clock className="w-4 h-4" />, label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  accepted: { icon: <CheckCircle className="w-4 h-4" />, label: 'Accepted', color: 'bg-green-100 text-green-700' },
  declined: { icon: <XCircle className="w-4 h-4" />, label: 'Declined', color: 'bg-red-100 text-red-700' },
  expired: { icon: <Clock className="w-4 h-4" />, label: 'Expired', color: 'bg-neutral-100 text-neutral-600' },
  cancelled: { icon: <XCircle className="w-4 h-4" />, label: 'Cancelled', color: 'bg-neutral-100 text-neutral-600' },
};

function RequestCard({ request }: { request: TutoringRequest }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const status = statusConfig[request.status] || statusConfig.pending;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
            {request.teacherProfilePhotoUrl ? (
              <img src={request.teacherProfilePhotoUrl} alt={request.teacherName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-blue-600 font-bold text-lg">
                {request.teacherName?.charAt(0) || 'T'}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">{request.teacherName}</h3>
            <p className="text-sm text-neutral-500">{request.subjectName}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-neutral-600">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(request.proposedDatetime)}</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-600">
          {sessionTypeConfig[request.sessionType].icon}
          <span>{sessionTypeConfig[request.sessionType].label}</span>
          <span className="text-neutral-400">|</span>
          <span>{request.proposedDuration} min</span>
        </div>
      </div>

      {request.message && (
        <p className="mt-3 text-sm text-neutral-600 bg-neutral-50 rounded-lg p-2 line-clamp-2">
          {request.message}
        </p>
      )}

      {request.teacherResponse && (
        <div className="mt-3 p-2 bg-blue-50 border-l-2 border-blue-400 rounded-r-lg">
          <p className="text-sm text-blue-900 font-medium">Teacher's Response:</p>
          <p className="text-sm text-blue-700">{request.teacherResponse}</p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-lg font-bold text-blue-600">GH₵{request.estimatedCost.toFixed(2)}</span>
        {request.status === 'accepted' && (
          <Link
            to={`/tutoring/sessions`}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View Session
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function TutoringRequests() {
  const { myRequests, isLoadingRequests, error, loadMyRequests } = useTutoringStore();
  const isLoading = isLoadingRequests;
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');

  useEffect(() => {
    loadMyRequests();
  }, [loadMyRequests]);

  const filteredRequests = myRequests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = myRequests.filter((r) => r.status === 'pending').length;
  const acceptedCount = myRequests.filter((r) => r.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Tutoring Requests</h1>
            <p className="text-neutral-600 mt-1">
              Track your tutoring requests and upcoming sessions
            </p>
          </div>
          <Link
            to="/tutors"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Find Tutors
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-2xl font-bold text-neutral-900">{myRequests.length}</p>
            <p className="text-sm text-neutral-500">Total Requests</p>
          </div>
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
            <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
            <p className="text-sm text-amber-600">Pending</p>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-2xl font-bold text-green-700">{acceptedCount}</p>
            <p className="text-sm text-green-600">Accepted</p>
          </div>
          <Link
            to="/tutoring/sessions"
            className="bg-blue-50 rounded-lg border border-blue-200 p-4 hover:bg-blue-100 transition-colors"
          >
            <p className="text-sm font-medium text-blue-700">View Sessions</p>
            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
              Go to sessions <ArrowRight className="w-3 h-3" />
            </p>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'accepted', 'declined'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => loadMyRequests()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
            <Calendar className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              {filter === 'all' ? 'No Requests Yet' : `No ${filter} Requests`}
            </h3>
            <p className="text-neutral-500 max-w-md mx-auto mb-6">
              {filter === 'all'
                ? 'Browse our tutor directory to find the perfect teacher and send your first tutoring request.'
                : `You don't have any ${filter} tutoring requests.`}
            </p>
            {filter === 'all' && (
              <Link
                to="/tutors"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Tutors
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
