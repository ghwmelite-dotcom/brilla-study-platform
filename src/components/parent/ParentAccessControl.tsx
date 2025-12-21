import { useEffect, useState } from 'react';
import { Users, UserMinus, Plus, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Card, CardHeader, Button, Badge } from '@/components/common';
import { useParentStore, useAuthStore } from '@/stores';
import { ParentInviteModal } from './ParentInviteModal';
import type { ParentStudentLink } from '@/types';

export function ParentAccessControl() {
  const { user } = useAuthStore();
  const {
    parentLinks,
    isLoading,
    error,
    fetchParentLinks,
    revokeParentAccess,
    clearError,
  } = useParentStore();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    fetchParentLinks();
  }, []);

  const canRevokeAccess = user?.schoolLevel === 'shs';

  const handleRevoke = async (parentId: string) => {
    setIsRevoking(true);
    try {
      await revokeParentAccess(parentId);
      setRevokeConfirm(null);
    } catch {
      // Error handled by store
    } finally {
      setIsRevoking(false);
    }
  };

  const activeLinks = parentLinks.filter((l) => l.status === 'active');
  const pendingLinks = parentLinks.filter((l) => l.status === 'pending');

  return (
    <>
      <Card className="p-6">
        <CardHeader
          title="Parent/Guardian Access"
          subtitle="Manage who can view your learning progress"
          action={
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowInviteModal(true)}
            >
              Invite Parent
            </Button>
          }
        />

        {/* SHS Opt-out Info */}
        {canRevokeAccess && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            As an SHS student, you can revoke parent access at any time.
          </div>
        )}

        {/* JHS Info */}
        {!canRevokeAccess && user?.role === 'student' && (
          <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-600">
            JHS students cannot revoke parent access. Contact your administrator if you have concerns.
          </div>
        )}

        {/* Loading State */}
        {isLoading && parentLinks.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {/* No Links */}
        {!isLoading && parentLinks.length === 0 && (
          <div className="text-center py-8 bg-neutral-50 rounded-lg">
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600 font-medium">No parents linked</p>
            <p className="text-sm text-neutral-500 mt-1">
              Generate an invite code to allow your parent to monitor your progress
            </p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => setShowInviteModal(true)}
            >
              Generate Invite Code
            </Button>
          </div>
        )}

        {/* Active Links */}
        {activeLinks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
              Linked Parents
            </h3>
            {activeLinks.map((link) => (
              <ParentLinkCard
                key={link.id}
                link={link}
                canRevoke={canRevokeAccess}
                isRevoking={isRevoking && revokeConfirm === link.parentId}
                showRevokeConfirm={revokeConfirm === link.parentId}
                onRevokeClick={() => setRevokeConfirm(link.parentId)}
                onRevokeConfirm={() => handleRevoke(link.parentId)}
                onRevokeCancel={() => setRevokeConfirm(null)}
              />
            ))}
          </div>
        )}

        {/* Pending Invites */}
        {pendingLinks.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
              Pending Invites
            </h3>
            {pendingLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">Pending Invite</p>
                    <p className="text-sm text-neutral-500">
                      Code: {link.inviteCode || 'N/A'}
                      {link.inviteCodeExpiresAt && (
                        <> - Expires {new Date(link.inviteCodeExpiresAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
                <Badge variant="warning" size="sm">Pending</Badge>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
            <button
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </Card>

      <ParentInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </>
  );
}

// Individual Parent Link Card
function ParentLinkCard({
  link,
  canRevoke,
  isRevoking,
  showRevokeConfirm,
  onRevokeClick,
  onRevokeConfirm,
  onRevokeCancel,
}: {
  link: ParentStudentLink;
  canRevoke: boolean;
  isRevoking: boolean;
  showRevokeConfirm: boolean;
  onRevokeClick: () => void;
  onRevokeConfirm: () => void;
  onRevokeCancel: () => void;
}) {
  return (
    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="font-bold text-primary">
              {link.parent?.name?.charAt(0).toUpperCase() || 'P'}
            </span>
          </div>
          <div>
            <p className="font-medium text-neutral-900">{link.parent?.name || 'Parent'}</p>
            <p className="text-sm text-neutral-500">
              {link.relationshipType === 'guardian' ? 'Guardian' : 'Parent'} -
              Linked {new Date(link.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm">Active</Badge>
          {canRevoke && !showRevokeConfirm && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRevokeClick}
              className="text-red-600 hover:bg-red-50"
            >
              <UserMinus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Revoke Confirmation */}
      {showRevokeConfirm && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                Revoke parent access?
              </p>
              <p className="text-xs text-red-600 mt-1">
                {link.parent?.name || 'This parent'} will no longer be able to view your progress.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRevokeCancel}
                  disabled={isRevoking}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={onRevokeConfirm}
                  disabled={isRevoking}
                >
                  {isRevoking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" /> Revoke
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
