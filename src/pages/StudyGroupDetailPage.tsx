import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Crown,
  Target,
  Lock,
  Send,
  LogOut,
  Trash2,
} from 'lucide-react';
import { useStudyGroupStore } from '@/stores/studyGroupStore';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import { cn } from '@/utils';

export default function StudyGroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentGroup,
    members,
    messages,
    error,
    fetchGroupDetails,
    fetchMessages,
    joinGroup,
    leaveGroup,
    deleteGroup,
    sendMessage,
    clearError,
  } = useStudyGroupStore();
  const toast = useToastStore();

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    clearError();
    fetchGroupDetails(groupId).then((ok) => {
      if (!ok) {
        setNotFound(true);
        return;
      }
      // The feed is members-only on the API; skip the call for non-members
      // viewing a public group so it doesn't surface a spurious 403 error.
      const isMemberNow = useStudyGroupStore
        .getState()
        .members.some((m) => m.userId === user?.id);
      if (isMemberNow) fetchMessages(groupId);
    });
  }, [groupId, fetchGroupDetails, fetchMessages, clearError, user?.id]);

  const isMember = members.some((m) => m.userId === user?.id);
  const isOwner = currentGroup?.ownerId === user?.id;
  const progressPercent = currentGroup
    ? Math.min(100, (currentGroup.weeklyProgress / Math.max(1, currentGroup.weeklyGoalXp)) * 100)
    : 0;

  const handleJoin = async () => {
    if (!groupId) return;
    const ok = await joinGroup(groupId);
    if (ok) {
      toast.showSuccess('Joined Group!', 'Welcome to the study group');
      fetchGroupDetails(groupId);
      fetchMessages(groupId);
    } else {
      toast.showError('Failed', useStudyGroupStore.getState().error || 'Could not join group');
    }
  };

  const handleLeave = async () => {
    if (!groupId) return;
    const ok = await leaveGroup(groupId);
    if (ok) {
      toast.showSuccess('Left Group', 'You have left the study group');
      navigate('/study-groups');
    } else {
      toast.showError('Failed', useStudyGroupStore.getState().error || 'Could not leave group');
    }
  };

  const handleDelete = async () => {
    if (!groupId) return;
    const ok = await deleteGroup(groupId);
    if (ok) {
      toast.showSuccess('Group Deleted', 'The study group has been removed');
      navigate('/study-groups');
    } else {
      toast.showError('Failed', useStudyGroupStore.getState().error || 'Could not delete group');
    }
  };

  const handleSend = async () => {
    if (!groupId || !draft.trim() || sending) return;
    setSending(true);
    const ok = await sendMessage(groupId, draft.trim());
    setSending(false);
    if (ok) {
      setDraft('');
    } else {
      toast.showError('Failed', useStudyGroupStore.getState().error || 'Could not send message');
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/study-groups')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center py-12 bg-white rounded-xl border">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">Group not found</h3>
            <p className="text-gray-500 text-sm">{error || 'This group may be private or deleted.'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/study-groups')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: currentGroup.color }}
            >
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{currentGroup.name}</h1>
                {!currentGroup.isPublic && <Lock className="w-4 h-4 text-gray-400" />}
              </div>
              {currentGroup.description && (
                <p className="text-gray-500 mt-0.5">{currentGroup.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {currentGroup.memberCount}/{currentGroup.maxMembers}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {currentGroup.weeklyGoalXp.toLocaleString()} XP/week
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!isMember && currentGroup.isPublic && (
              <button
                onClick={handleJoin}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Join Group
              </button>
            )}
            {isMember && !isOwner && (
              <button
                onClick={handleLeave}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Leave
              </button>
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Weekly progress */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Weekly Progress</span>
            <span className="font-medium text-gray-700">
              {currentGroup.weeklyProgress.toLocaleString()} / {currentGroup.weeklyGoalXp.toLocaleString()} XP
              ({Math.round(progressPercent)}%)
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%`, backgroundColor: currentGroup.color }}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Members */}
          <div className="bg-white rounded-xl border p-4 h-fit">
            <h2 className="font-semibold text-gray-900 mb-3">Members ({members.length})</h2>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-medium flex-shrink-0">
                    {(member.userName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {member.userName || 'Unknown'}
                      </span>
                      {member.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                    </div>
                    <span className="text-xs text-gray-500">
                      {member.weeklyXpContribution.toLocaleString()} XP this week
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group feed */}
          <div className="md:col-span-2 bg-white rounded-xl border flex flex-col">
            <h2 className="font-semibold text-gray-900 px-4 pt-4 pb-3 border-b">Group Feed</h2>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-96 min-h-[12rem]">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((msg) => {
                  const mine = msg.userId === user?.id;
                  return (
                    <div key={msg.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[75%] rounded-xl px-3 py-2',
                          mine ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                        )}
                      >
                        {!mine && (
                          <div className="text-xs font-medium text-indigo-600 mb-0.5">
                            {msg.userName || 'Unknown'}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <div className={cn('text-[10px] mt-1', mine ? 'text-indigo-200' : 'text-gray-400')}>
                          {msg.createdAt}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {isMember ? (
              <div className="flex items-center gap-2 p-3 border-t">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Message the group..."
                  maxLength={2000}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || sending}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3 border-t">
                Join this group to read and post messages.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
