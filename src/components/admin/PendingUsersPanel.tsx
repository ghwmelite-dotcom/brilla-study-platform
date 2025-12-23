import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  BookOpen,
  Shield,
  School,
  BadgeCheck,
  Calendar,
  Briefcase,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils';

interface PendingUsersPanelProps {
  className?: string;
}

export function PendingUsersPanel({ className }: PendingUsersPanelProps) {
  const { pendingUsers, pendingCount, loadPendingUsers, approveUser, rejectUser } = useAuthStore();
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionResult, setActionResult] = useState<{ userId: string; type: 'approved' | 'rejected' } | null>(null);

  useEffect(() => {
    loadPendingUsers();
  }, [loadPendingUsers]);

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      await approveUser(userId);
      setActionResult({ userId, type: 'approved' });
      setTimeout(() => setActionResult(null), 2000);
    } catch (error) {
      console.error('Failed to approve user:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectReason.trim()) return;

    setProcessingId(userId);
    try {
      await rejectUser(userId, rejectReason);
      setShowRejectModal(null);
      setRejectReason('');
      setActionResult({ userId, type: 'rejected' });
      setTimeout(() => setActionResult(null), 2000);
    } catch (error) {
      console.error('Failed to reject user:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="w-5 h-5 text-blue-600" />;
      case 'teacher':
        return <BookOpen className="w-5 h-5 text-green-600" />;
      case 'admin':
        return <Shield className="w-5 h-5 text-purple-600" />;
      default:
        return <Users className="w-5 h-5 text-neutral-600" />;
    }
  };

  const getRoleBgColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100';
      case 'teacher':
        return 'bg-green-100';
      case 'admin':
        return 'bg-purple-100';
      default:
        return 'bg-neutral-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSchoolLevelLabel = (level?: string) => {
    if (level === 'jss') return 'Junior High School';
    if (level === 'shs') return 'Senior High School';
    return level;
  };

  if (pendingCount === 0) {
    return (
      <div className={cn('bg-white rounded-xl border border-neutral-200 p-6', className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-neutral-500" />
            <h3 className="font-semibold text-neutral-900">Pending Approvals</h3>
          </div>
          <button
            onClick={() => loadPendingUsers()}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-neutral-600">No pending registrations</p>
          <p className="text-sm text-neutral-400 mt-1">All caught up!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-xl border border-neutral-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">Pending Approvals</h3>
            <p className="text-sm text-neutral-500">{pendingCount} registration{pendingCount !== 1 ? 's' : ''} awaiting review</p>
          </div>
        </div>
        <button
          onClick={() => loadPendingUsers()}
          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* User List */}
      <div className="divide-y divide-neutral-100 max-h-[500px] overflow-y-auto">
        {pendingUsers.map((user) => (
          <div key={user.id} className="relative">
            {/* Success/Error Overlay */}
            {actionResult?.userId === user.id && (
              <div className={cn(
                'absolute inset-0 z-10 flex items-center justify-center',
                actionResult.type === 'approved' ? 'bg-green-50/95' : 'bg-red-50/95'
              )}>
                <div className="flex items-center gap-2">
                  {actionResult.type === 'approved' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700">User Approved!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-medium text-red-700">User Rejected</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* User Card */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar/Role Icon */}
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', getRoleBgColor(user.role))}>
                  {getRoleIcon(user.role)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-neutral-900">{user.name}</h4>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                      user.role === 'student' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'teacher' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    )}>
                      {user.role}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-neutral-400">
                    <Clock className="w-3 h-3" />
                    <span>Applied {formatDate(user.registeredAt)}</span>
                  </div>
                </div>

                {/* Expand/Collapse */}
                <button
                  onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  {expandedUserId === user.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedUserId === user.id && (
                <div className="mt-4 pl-15 space-y-3">
                  {/* Student Details */}
                  {user.role === 'student' && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {user.schoolLevel && (
                        <div className="flex items-center gap-2">
                          <School className="w-4 h-4 text-neutral-400" />
                          <span className="text-neutral-600">{getSchoolLevelLabel(user.schoolLevel)}</span>
                        </div>
                      )}
                      {user.yearGroup && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span className="text-neutral-600">
                            {user.schoolLevel === 'jss' ? `Form ${user.yearGroup}` : `Year ${user.yearGroup}`}
                          </span>
                        </div>
                      )}
                      {user.schoolName && (
                        <div className="flex items-center gap-2 col-span-2">
                          <School className="w-4 h-4 text-neutral-400" />
                          <span className="text-neutral-600">{user.schoolName}</span>
                        </div>
                      )}
                      {user.house && (
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-600">House: {user.house}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher Details */}
                  {user.role === 'teacher' && (
                    <div className="space-y-2 text-sm">
                      {user.teacherLicenseNumber && (
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-neutral-400" />
                          <span className="text-neutral-600">GES License: {user.teacherLicenseNumber}</span>
                        </div>
                      )}
                      {user.schoolName && (
                        <div className="flex items-center gap-2">
                          <School className="w-4 h-4 text-neutral-400" />
                          <span className="text-neutral-600">{user.schoolName}</span>
                        </div>
                      )}
                      {user.yearsExperience && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-neutral-400" />
                          <span className="text-neutral-600">{user.yearsExperience} years experience</span>
                        </div>
                      )}
                      {user.subjectsTaught && user.subjectsTaught.length > 0 && (
                        <div>
                          <span className="text-neutral-500">Subjects: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.subjectsTaught.map((subject) => (
                              <span
                                key={subject}
                                className="px-2 py-0.5 bg-neutral-100 rounded text-xs text-neutral-600"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {user.qualifications && (
                        <div className="text-neutral-600">
                          <span className="text-neutral-500">Qualifications: </span>
                          {user.qualifications}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Details */}
                  {user.role === 'admin' && user.adminCode && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-neutral-400" />
                      <span className="text-neutral-600">Invitation Code: {user.adminCode}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-2 pl-15">
                <button
                  onClick={() => handleApprove(user.id)}
                  disabled={processingId === user.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingId === user.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => setShowRejectModal(user.id)}
                  disabled={processingId === user.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <UserX className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowRejectModal(null)}
              className="absolute top-4 right-4 p-1 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Reject Registration</h3>
                <p className="text-sm text-neutral-500">Please provide a reason</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Rejection Reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Invalid GES license number, incomplete information..."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRejectModal(null)}
                className="flex-1 px-4 py-2 text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectReason.trim() || processingId === showRejectModal}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processingId === showRejectModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
                <span>Reject User</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
