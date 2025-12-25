import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  Calendar,
  Video,
  MessageCircle,
  PenTool,
  Loader2,
  AlertCircle,
  Users,
  Star,
  Settings,
  Play,
  Wallet,
} from 'lucide-react';
import { useTutoringStore } from '@/stores/tutoringStore';
import type { TutoringRequest, TutoringSession, SessionType } from '@/types/tutoring';

const sessionTypeConfig: Record<SessionType, { icon: React.ReactNode; label: string }> = {
  video: { icon: <Video className="w-4 h-4" />, label: 'Video' },
  chat: { icon: <MessageCircle className="w-4 h-4" />, label: 'Chat' },
  whiteboard: { icon: <PenTool className="w-4 h-4" />, label: 'Whiteboard' },
};

function IncomingRequestCard({
  request,
  onAccept,
  onDecline,
  isProcessing,
}: {
  request: TutoringRequest;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing: boolean;
}) {
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

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold">
              {request.studentName?.charAt(0) || 'S'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-neutral-900">{request.studentName || 'Student'}</h4>
            <p className="text-sm text-neutral-500">{request.subjectName}</p>
          </div>
        </div>
        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          Pending
        </span>
      </div>

      <div className="space-y-2 text-sm mb-3">
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
        <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-2 mb-3 line-clamp-2">
          "{request.message}"
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
        <span className="text-lg font-bold text-green-600">
          +GH₵{(request.estimatedCost * 0.85).toFixed(2)}
        </span>
        <div className="flex gap-2">
          <button
            onClick={onDecline}
            disabled={isProcessing}
            className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={isProcessing}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

function UpcomingSessionCard({ session }: { session: TutoringSession }) {
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

  const sessionTime = new Date(session.scheduledDatetime);
  const now = new Date();
  const minutesUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60);
  const canStart = minutesUntil <= 10 && minutesUntil > -session.scheduledDuration;

  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-bold">
            {session.studentName?.charAt(0) || 'S'}
          </span>
        </div>
        <div>
          <h4 className="font-medium text-neutral-900">{session.studentName}</h4>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            {sessionTypeConfig[session.sessionType].icon}
            <span>{session.subjectName}</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-neutral-900">{formatDate(session.scheduledDatetime)}</p>
        {canStart && (
          <button className="mt-1 px-2 py-1 bg-green-600 text-white text-xs rounded flex items-center gap-1">
            <Play className="w-3 h-3" />
            Start
          </button>
        )}
      </div>
    </div>
  );
}

export default function TeacherTutoringDashboard() {
  const {
    myProfile,
    incomingRequests,
    teacherSessions,
    earnings,
    isLoadingMyProfile,
    loadMyProfile,
    loadIncomingRequests,
    loadTeacherSessions,
    loadEarnings,
    acceptRequest,
    declineRequest,
  } = useTutoringStore();
  const isLoading = isLoadingMyProfile;

  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'sessions' | 'earnings'>('requests');

  useEffect(() => {
    loadMyProfile();
    loadIncomingRequests();
    loadTeacherSessions();
    loadEarnings();
  }, [loadMyProfile, loadIncomingRequests, loadTeacherSessions, loadEarnings]);

  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await acceptRequest(requestId);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await declineRequest(requestId);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const pendingRequests = incomingRequests.filter((r) => r.status === 'pending');
  const upcomingSessions = teacherSessions.filter((s) => s.status === 'scheduled' || s.status === 'in_progress');
  const completedSessions = teacherSessions.filter((s) => s.status === 'completed');

  if (isLoading && !myProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Not yet set up profile
  if (!myProfile) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-white rounded-xl border border-neutral-200 p-8">
            <Users className="w-16 h-16 mx-auto text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Start Your Tutoring Journey</h1>
            <p className="text-neutral-600 mb-6">
              Set up your tutor profile to appear in the public directory and receive tutoring requests from students.
            </p>
            <Link
              to="/teacher/directory-profile"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Settings className="w-5 h-5" />
              Set Up Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Tutoring Dashboard</h1>
            <p className="text-neutral-600">Manage your tutoring requests and sessions</p>
          </div>
          <Link
            to="/teacher/directory-profile"
            className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
          >
            <Settings className="w-4 h-4" />
            Edit Profile
          </Link>
        </div>

        {/* Profile Status Banner */}
        {myProfile.directoryStatus !== 'approved' && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            myProfile.directoryStatus === 'pending'
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-neutral-50 border border-neutral-200'
          }`}>
            {myProfile.directoryStatus === 'pending' ? (
              <>
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="text-amber-900">Your profile is pending approval. You'll receive requests once approved.</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-neutral-500" />
                <p className="text-neutral-700">
                  Complete your profile and submit for approval to start receiving tutoring requests.
                </p>
                <Link to="/teacher/directory-profile" className="ml-auto text-blue-600 hover:underline text-sm">
                  Complete Profile
                </Link>
              </>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{pendingRequests.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">Upcoming</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{upcomingSessions.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{completedSessions.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium">Earnings</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">
              GH₵{earnings?.totalTutoringEarnings.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sessions'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Sessions
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'earnings'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            Earnings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'requests' && (
          <div>
            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
                <Clock className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Pending Requests</h3>
                <p className="text-neutral-500">
                  New tutoring requests from students will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map((request) => (
                  <IncomingRequestCard
                    key={request.id}
                    request={request}
                    onAccept={() => handleAcceptRequest(request.id)}
                    onDecline={() => handleDeclineRequest(request.id)}
                    isProcessing={processingRequestId === request.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Upcoming Sessions
              </h3>
              {upcomingSessions.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">No upcoming sessions</p>
              ) : (
                <div>
                  {upcomingSessions.slice(0, 5).map((session: TutoringSession) => (
                    <UpcomingSessionCard key={session.id} session={session} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Completed */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Recently Completed
              </h3>
              {completedSessions.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">No completed sessions yet</p>
              ) : (
                <div>
                  {completedSessions.slice(0, 5).map((session: TutoringSession) => (
                    <div key={session.id} className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
                      <div>
                        <h4 className="font-medium text-neutral-900">{session.studentName}</h4>
                        <p className="text-sm text-neutral-500">{session.subjectName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">+GH₵{session.teacherEarnings.toFixed(2)}</p>
                        {session.studentReviewed && (
                          <div className="flex items-center gap-1 text-sm text-neutral-500">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span>Reviewed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Earnings Summary */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="font-semibold text-neutral-900 mb-6">Earnings Overview</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">Total Tutoring Earnings</p>
                  <p className="text-2xl font-bold text-green-700">
                    GH₵{earnings?.totalTutoringEarnings.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-600 mb-1">Pending Tutoring</p>
                  <p className="text-2xl font-bold text-amber-700">
                    GH₵{earnings?.pendingTutoring.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 mb-1">Available for Withdrawal</p>
                  <p className="text-2xl font-bold text-blue-700">
                    GH₵{earnings?.availableBalance.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 mb-1">Total Paid Out</p>
                  <p className="text-2xl font-bold text-purple-700">
                    GH₵{earnings?.totalPaidOut.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Average Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold">{myProfile.averageRating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Total Reviews</span>
                  <span className="font-bold">{myProfile.ratingCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Total Sessions</span>
                  <span className="font-bold">{myProfile.totalSessions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Response Rate</span>
                  <span className="font-bold">{myProfile.responseRate}%</span>
                </div>
              </div>

              {earnings && earnings.availableBalance >= 50 && (
                <button className="w-full mt-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Request Payout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
