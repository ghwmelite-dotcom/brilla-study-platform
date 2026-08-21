import { useState, useEffect } from 'react';
import { useRef } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Star,
  Video,
  MessageCircle,
  PenTool,
  Loader2,
  AlertCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { tutoringService } from '@/lib/services';
import type { TeacherDirectoryProfile, SessionType } from '@/types/tutoring';

interface PendingProfile extends TeacherDirectoryProfile {
  teacherName?: string;
  teacherEmail?: string;
  teacherLicenseNumber?: string;
  subjectsTaught?: string;
  yearsExperience?: string;
  qualifications?: string;
}

interface Stats {
  totalTeachers: number;
  pendingApprovals: number;
  activeTeachers: number;
  totalSessions: number;
  completedSessions: number;
  totalRevenue: number;
  platformRevenue: number;
  teacherPayouts: number;
  avgRating: number;
}

const sessionTypeIcons: Record<SessionType, React.ReactNode> = {
  video: <Video className="w-4 h-4" />,
  chat: <MessageCircle className="w-4 h-4" />,
  whiteboard: <PenTool className="w-4 h-4" />,
};

function formatCurrency(amount: number): string {
  return `GH\u20B5${amount.toFixed(2)}`;
}

function ProfileCard({
  profile,
  onApprove,
  onReject,
  isProcessing,
}: {
  profile: PendingProfile;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject();
      setShowRejectModal(false);
    }
  };

  // Handle subjects and sessionTypes - they come as JSON strings from the API
  const subjects = typeof profile.subjects === 'string'
    ? JSON.parse(profile.subjects || '[]')
    : (profile.subjects || []);
  const sessionTypes = (typeof profile.sessionTypes === 'string'
    ? JSON.parse(profile.sessionTypes || '[]')
    : (profile.sessionTypes || [])) as SessionType[];

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
            {profile.profilePhotoUrl ? (
              <img
                src={profile.profilePhotoUrl}
                alt={profile.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-blue-600 font-bold text-xl">
                {profile.displayName?.charAt(0) || 'T'}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">{profile.displayName}</h3>
            <p className="text-sm text-neutral-500">{profile.teacherEmail}</p>
            {profile.teacherLicenseNumber && (
              <p className="text-xs text-neutral-400">License: {profile.teacherLicenseNumber}</p>
            )}
          </div>
        </div>
        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-neutral-600 line-clamp-2">{profile.bio}</p>
        )}

        {/* Subjects */}
        <div>
          <p className="text-xs font-medium text-neutral-500 mb-2">Subjects</p>
          <div className="flex flex-wrap gap-2">
            {subjects.slice(0, 5).map((subject: { subjectName: string; level: string }, i: number) => (
              <span
                key={i}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                {subject.subjectName} ({subject.level})
              </span>
            ))}
            {subjects.length > 5 && (
              <span className="text-xs text-neutral-500">+{subjects.length - 5} more</span>
            )}
          </div>
        </div>

        {/* Session Types & Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {sessionTypes.map((type) => (
              <span
                key={type}
                className="p-1.5 bg-neutral-100 text-neutral-600 rounded"
                title={type}
              >
                {sessionTypeIcons[type]}
              </span>
            ))}
          </div>
          <span className="font-bold text-blue-600">
            {formatCurrency(profile.hourlyRate)}/hour
          </span>
        </div>

        {/* Teacher Info */}
        {(profile.yearsExperience || profile.qualifications) && (
          <div className="pt-3 border-t border-neutral-100">
            <p className="text-xs text-neutral-500">
              {profile.yearsExperience && (
                <span className="mr-3">Experience: {profile.yearsExperience}</span>
              )}
              {profile.qualifications && (
                <span>Qualifications: {profile.qualifications}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex gap-3">
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <CheckCircle className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={isProcessing}
          className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </button>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Reject Profile</h3>
            <p className="text-neutral-600 mb-4">
              Please provide a reason for rejecting {profile.displayName}'s profile.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || isProcessing}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTutoringDirectory() {
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const loadDataRef = useRef<() => void>(() => {});

  useEffect(() => {
    loadDataRef.current();
  }, [page]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [profilesData, statsData] = await Promise.all([
        tutoringService.getPendingProfiles(page, 12),
        tutoringService.getAdminStats(),
      ]);

      const data = profilesData as { profiles: PendingProfile[]; total: number; pageSize: number };
      setProfiles(data.profiles || []);
      setTotalPages(Math.ceil((data.total || 0) / (data.pageSize || 12)));
      setStats(statsData as Stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  loadDataRef.current = loadData;

  const handleApprove = async (profileId: string) => {
    setProcessingId(profileId);
    try {
      await tutoringService.approveProfile(profileId);
      setMessage({ type: 'success', text: 'Profile approved successfully' });
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      if (stats) {
        setStats({
          ...stats,
          pendingApprovals: stats.pendingApprovals - 1,
          activeTeachers: stats.activeTeachers + 1,
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to approve' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleReject = async (profileId: string, reason: string) => {
    setProcessingId(profileId);
    try {
      await tutoringService.rejectProfile(profileId, reason);
      setMessage({ type: 'success', text: 'Profile rejected' });
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      if (stats) {
        setStats({
          ...stats,
          pendingApprovals: stats.pendingApprovals - 1,
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to reject' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Tutoring Directory Management</h1>
          <p className="text-neutral-600 mt-1">
            Review and approve teacher profiles for the tutoring marketplace
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.pendingApprovals}</p>
                  <p className="text-sm text-neutral-500">Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.activeTeachers}</p>
                  <p className="text-sm text-neutral-500">Active Teachers</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.completedSessions}</p>
                  <p className="text-sm text-neutral-500">Sessions</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {formatCurrency(stats.platformRevenue)}
                  </p>
                  <p className="text-sm text-neutral-500">Revenue</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {stats.avgRating?.toFixed(1) || 'N/A'}
                  </p>
                  <p className="text-sm text-neutral-500">Avg Rating</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Profiles */}
        {error ? (
          <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              No Pending Approvals
            </h3>
            <p className="text-neutral-500">
              All teacher profiles have been reviewed
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Pending Approvals ({profiles.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onApprove={() => handleApprove(profile.id)}
                  onReject={() => handleReject(profile.id, '')}
                  isProcessing={processingId === profile.id}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-sm text-neutral-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
