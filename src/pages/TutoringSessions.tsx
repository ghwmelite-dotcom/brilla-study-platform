import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Play,
  Star,
} from 'lucide-react';
import { useTutoringStore } from '@/stores/tutoringStore';
import type { TutoringSession, SessionType } from '@/types/tutoring';

const sessionTypeConfig: Record<SessionType, { icon: React.ReactNode; label: string }> = {
  video: { icon: <Video className="w-4 h-4" />, label: 'Video Call' },
  chat: { icon: <MessageCircle className="w-4 h-4" />, label: 'Chat' },
  whiteboard: { icon: <PenTool className="w-4 h-4" />, label: 'Whiteboard' },
};

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  scheduled: { icon: <Clock className="w-4 h-4" />, label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  in_progress: { icon: <Play className="w-4 h-4" />, label: 'In Progress', color: 'bg-green-100 text-green-700' },
  completed: { icon: <CheckCircle className="w-4 h-4" />, label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled_by_student: { icon: <XCircle className="w-4 h-4" />, label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  cancelled_by_teacher: { icon: <XCircle className="w-4 h-4" />, label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  no_show: { icon: <XCircle className="w-4 h-4" />, label: 'No Show', color: 'bg-neutral-100 text-neutral-600' },
};

function SessionCard({ session, onJoin, onReview }: { session: TutoringSession; onJoin: () => void; onReview: () => void }) {
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

  const status = statusConfig[session.status] || statusConfig.scheduled;
  const canJoin = session.status === 'scheduled' || session.status === 'in_progress';
  const needsReview = session.status === 'completed' && !session.studentReviewed;

  // Check if session is starting soon (within 15 minutes)
  const sessionTime = new Date(session.scheduledDatetime);
  const now = new Date();
  const minutesUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60);
  const isStartingSoon = minutesUntilSession <= 15 && minutesUntilSession > -session.scheduledDuration;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
            {session.teacherProfilePhotoUrl ? (
              <img src={session.teacherProfilePhotoUrl} alt={session.teacherName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-blue-600 font-bold text-lg">
                {session.teacherName?.charAt(0) || 'T'}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">{session.teacherName}</h3>
            <p className="text-sm text-neutral-500">{session.subjectName}</p>
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
          <span>{formatDate(session.scheduledDatetime)}</span>
          {isStartingSoon && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              Starting Soon
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-neutral-600">
          {sessionTypeConfig[session.sessionType].icon}
          <span>{sessionTypeConfig[session.sessionType].label}</span>
          <span className="text-neutral-400">|</span>
          <span>{session.scheduledDuration} min</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-blue-600">GH₵{session.sessionCost.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          {canJoin && (
            <button
              onClick={onJoin}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <Play className="w-4 h-4" />
              Join
            </button>
          )}
          {needsReview && (
            <button
              onClick={onReview}
              className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 flex items-center gap-1"
            >
              <Star className="w-4 h-4" />
              Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TutoringSessions() {
  const navigate = useNavigate();
  const { mySessions, isLoadingSessions, error, loadMySessions } = useTutoringStore();
  const isLoading = isLoadingSessions;
  const [filter, setFilter] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [showReviewModal, setShowReviewModal] = useState<TutoringSession | null>(null);

  useEffect(() => {
    loadMySessions();
  }, [loadMySessions]);

  const filteredSessions = mySessions.filter((session) => {
    if (filter === 'upcoming') {
      return session.status === 'scheduled' || session.status === 'in_progress';
    }
    if (filter === 'completed') {
      return session.status === 'completed';
    }
    return true;
  });

  const upcomingCount = mySessions.filter((s) => s.status === 'scheduled' || s.status === 'in_progress').length;
  const completedCount = mySessions.filter((s) => s.status === 'completed').length;

  const handleJoinSession = (session: TutoringSession) => {
    // Navigate to appropriate session type
    if (session.sessionType === 'whiteboard' && session.whiteboardId) {
      navigate(`/whiteboard/${session.whiteboardId}`);
    } else if (session.sessionType === 'chat' && session.chatRoomId) {
      navigate(`/chat/${session.chatRoomId}`);
    } else if (session.sessionType === 'video' && session.videoRoomUrl) {
      window.open(session.videoRoomUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My Tutoring Sessions</h1>
            <p className="text-neutral-600 mt-1">
              View and manage your scheduled tutoring sessions
            </p>
          </div>
          <Link
            to="/tutoring/requests"
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            View Requests
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-2xl font-bold text-neutral-900">{mySessions.length}</p>
            <p className="text-sm text-neutral-500">Total Sessions</p>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <p className="text-2xl font-bold text-blue-700">{upcomingCount}</p>
            <p className="text-sm text-blue-600">Upcoming</p>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-2xl font-bold text-green-700">{completedCount}</p>
            <p className="text-sm text-green-600">Completed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['upcoming', 'completed', 'all'] as const).map((status) => (
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

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => loadMySessions()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
            <Calendar className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              {filter === 'upcoming' ? 'No Upcoming Sessions' : filter === 'completed' ? 'No Completed Sessions' : 'No Sessions Yet'}
            </h3>
            <p className="text-neutral-500 max-w-md mx-auto mb-6">
              {filter === 'upcoming'
                ? 'You have no upcoming tutoring sessions. Browse tutors to book your next session.'
                : filter === 'completed'
                ? "You haven't completed any tutoring sessions yet."
                : 'Start learning by booking a session with one of our experienced tutors.'}
            </p>
            <Link
              to="/tutors"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Tutors
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onJoin={() => handleJoinSession(session)}
                onReview={() => setShowReviewModal(session)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Review Modal - simplified for now */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Review Your Session</h3>
            <p className="text-neutral-600 mb-4">
              How was your session with {showReviewModal.teacherName}?
            </p>
            <p className="text-sm text-neutral-500 mb-4">
              Review feature coming soon!
            </p>
            <button
              onClick={() => setShowReviewModal(null)}
              className="w-full py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
