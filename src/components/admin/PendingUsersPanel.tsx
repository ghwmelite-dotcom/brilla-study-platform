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
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils';
import { AdminButton, AdminModal } from './common';

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
  const [rejectError, setRejectError] = useState<string | null>(null);

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
    if (!rejectReason.trim()) {
      setRejectError('Please enter a rejection reason');
      return;
    }

    setRejectError(null);
    setProcessingId(userId);
    try {
      await rejectUser(userId, rejectReason);
      setShowRejectModal(null);
      setRejectReason('');
      setActionResult({ userId, type: 'rejected' });
      setTimeout(() => setActionResult(null), 2000);
    } catch (error) {
      console.error('Failed to reject user:', error);
      setRejectError(error instanceof Error ? error.message : 'Failed to reject user. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="w-5 h-5 text-admin-accent-blue" />;
      case 'teacher':
        return <BookOpen className="w-5 h-5 text-admin-accent-emerald" />;
      case 'admin':
        return <Shield className="w-5 h-5 text-admin-accent-purple" />;
      default:
        return <Users className="w-5 h-5 text-admin-text-muted" />;
    }
  };

  const getRoleBgColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-500/20';
      case 'teacher':
        return 'bg-emerald-500/20';
      case 'admin':
        return 'bg-purple-500/20';
      default:
        return 'bg-admin-bg-tertiary';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-500/20 text-admin-accent-blue border border-blue-500/30';
      case 'teacher':
        return 'bg-emerald-500/20 text-admin-accent-emerald border border-emerald-500/30';
      case 'admin':
        return 'bg-purple-500/20 text-admin-accent-purple border border-purple-500/30';
      default:
        return 'bg-admin-bg-tertiary text-admin-text-muted';
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
      <div className={cn('', className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-admin-text-muted" />
            <h3 className="font-semibold text-admin-text">Pending Approvals</h3>
          </div>
          <button
            onClick={() => loadPendingUsers()}
            className="p-2 text-admin-text-muted hover:text-admin-text hover:bg-admin-bg-tertiary rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-admin-accent-emerald" />
          </div>
          <p className="text-admin-text-secondary">No pending registrations</p>
          <p className="text-sm text-admin-text-muted mt-1">All caught up!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* User List */}
      <div className="divide-y divide-admin-border max-h-[600px] overflow-y-auto admin-scrollbar">
        {pendingUsers.map((user) => (
          <div key={user.id} className="relative">
            {/* Success/Error Overlay */}
            {actionResult?.userId === user.id && (
              <div className={cn(
                'absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm',
                actionResult.type === 'approved' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
              )}>
                <div className="flex items-center gap-2">
                  {actionResult.type === 'approved' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-admin-accent-emerald" />
                      <span className="font-medium text-admin-accent-emerald">User Approved!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-admin-accent-rose" />
                      <span className="font-medium text-admin-accent-rose">User Rejected</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* User Card */}
            <div className="p-4 hover:bg-admin-bg-tertiary/30 transition-colors">
              <div className="flex items-start gap-3">
                {/* Avatar/Role Icon */}
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', getRoleBgColor(user.role))}>
                  {getRoleIcon(user.role)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-admin-text">{user.name}</h4>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                      getRoleBadgeColor(user.role)
                    )}>
                      {user.role}
                    </span>
                  </div>
                  <p className="text-sm text-admin-text-secondary truncate">{user.email}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-admin-text-muted">
                    <Clock className="w-3 h-3" />
                    <span>Applied {formatDate(user.registeredAt)}</span>
                  </div>
                </div>

                {/* Expand/Collapse */}
                <button
                  onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                  className="p-1.5 text-admin-text-muted hover:text-admin-text hover:bg-admin-bg-tertiary rounded-lg transition-colors"
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
                <div className="mt-4 ml-15 space-y-3 pl-4 border-l-2 border-admin-border">
                  {/* Student Details */}
                  {user.role === 'student' && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {user.schoolLevel && (
                        <div className="flex items-center gap-2">
                          <School className="w-4 h-4 text-admin-text-muted" />
                          <span className="text-admin-text-secondary">{getSchoolLevelLabel(user.schoolLevel)}</span>
                        </div>
                      )}
                      {user.yearGroup && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-admin-text-muted" />
                          <span className="text-admin-text-secondary">
                            {user.schoolLevel === 'jss' ? `Form ${user.yearGroup}` : `Year ${user.yearGroup}`}
                          </span>
                        </div>
                      )}
                      {user.schoolName && (
                        <div className="flex items-center gap-2 col-span-2">
                          <School className="w-4 h-4 text-admin-text-muted" />
                          <span className="text-admin-text-secondary">{user.schoolName}</span>
                        </div>
                      )}
                      {user.house && (
                        <div className="flex items-center gap-2">
                          <span className="text-admin-text-secondary">House: {user.house}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher Details */}
                  {user.role === 'teacher' && (
                    <div className="space-y-2 text-sm">
                      {user.teacherLicenseNumber && (
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-admin-text-muted" />
                          <span className="text-admin-text-secondary">GES License: <span className="text-admin-text">{user.teacherLicenseNumber}</span></span>
                        </div>
                      )}
                      {user.schoolName && (
                        <div className="flex items-center gap-2">
                          <School className="w-4 h-4 text-admin-text-muted" />
                          <span className="text-admin-text-secondary">{user.schoolName}</span>
                        </div>
                      )}
                      {user.yearsExperience && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-admin-text-muted" />
                          <span className="text-admin-text-secondary">{user.yearsExperience} years experience</span>
                        </div>
                      )}
                      {user.subjectsTaught && user.subjectsTaught.length > 0 && (
                        <div>
                          <span className="text-admin-text-muted">Subjects: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.subjectsTaught.map((subject) => (
                              <span
                                key={subject}
                                className="px-2 py-0.5 bg-admin-bg-tertiary rounded text-xs text-admin-text-secondary"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {user.qualifications && (
                        <div className="text-admin-text-secondary">
                          <span className="text-admin-text-muted">Qualifications: </span>
                          {user.qualifications}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Details */}
                  {user.role === 'admin' && user.adminCode && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-admin-text-muted" />
                      <span className="text-admin-text-secondary">Invitation Code: <span className="text-admin-text font-mono">{user.adminCode}</span></span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-2 ml-15">
                <AdminButton
                  variant="primary"
                  onClick={() => handleApprove(user.id)}
                  disabled={processingId === user.id}
                  isLoading={processingId === user.id}
                  leftIcon={<UserCheck className="w-4 h-4" />}
                  className="flex-1"
                >
                  Approve
                </AdminButton>
                <AdminButton
                  variant="danger"
                  onClick={() => {
                    setRejectError(null);
                    setRejectReason('');
                    setShowRejectModal(user.id);
                  }}
                  disabled={processingId === user.id}
                  leftIcon={<UserX className="w-4 h-4" />}
                  className="flex-1"
                >
                  Reject
                </AdminButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      <AdminModal
        isOpen={!!showRejectModal}
        onClose={() => setShowRejectModal(null)}
        title="Reject Registration"
        subtitle="Please provide a reason for rejection"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1.5">
              Rejection Reason
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError(null);
              }}
              placeholder="e.g., Invalid GES license number, incomplete information..."
              rows={3}
              className="admin-input resize-none"
            />
          </div>

          {rejectError && (
            <div className="p-3 bg-admin-accent-rose/10 border border-admin-accent-rose/30 rounded-lg text-sm text-admin-accent-rose">
              {rejectError}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <AdminButton
              variant="secondary"
              onClick={() => setShowRejectModal(null)}
              className="flex-1"
            >
              Cancel
            </AdminButton>
            <AdminButton
              variant="danger"
              onClick={() => showRejectModal && handleReject(showRejectModal)}
              disabled={!rejectReason.trim() || (showRejectModal ? processingId === showRejectModal : false)}
              isLoading={showRejectModal ? processingId === showRejectModal : false}
              leftIcon={<UserX className="w-4 h-4" />}
              className="flex-1"
            >
              Reject User
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
