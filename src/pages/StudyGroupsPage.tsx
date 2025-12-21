import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Plus,
  Crown,
  Target,
  Lock,
  Globe,
} from 'lucide-react';
import { useStudyGroupStore } from '@/stores/studyGroupStore';
import { useAuthStore } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import type { StudyGroup } from '@/types';
import { cn } from '@/utils';

interface GroupCardProps {
  group: StudyGroup;
  isOwner: boolean;
  onView: (group: StudyGroup) => void;
  onJoin?: (groupId: string) => void;
}

function GroupCard({ group, isOwner, onView, onJoin }: GroupCardProps) {
  const progressPercent = Math.min(100, (group.weeklyProgress / group.weeklyGoalXp) * 100);

  return (
    <div
      className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(group)}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
          style={{ backgroundColor: group.color }}
        >
          <Users className="w-7 h-7" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
            {isOwner && (
              <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
            {!group.isPublic && (
              <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </div>
          {group.description && (
            <p className="text-sm text-gray-500 truncate mt-0.5">{group.description}</p>
          )}

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {group.memberCount}/{group.maxMembers}
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {group.weeklyGoalXp.toLocaleString()} XP/week
            </span>
          </div>

          {/* Weekly progress */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Weekly Progress</span>
              <span className="font-medium text-gray-700">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: group.color,
                }}
              />
            </div>
          </div>
        </div>

        {onJoin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoin(group.id);
            }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Join
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudyGroupsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    myGroups,
    publicGroups,
    isLoading,
    fetchMyGroups,
    fetchPublicGroups,
    joinGroup,
    createGroup,
  } = useStudyGroupStore();
  const toast = useToastStore();

  const [tab, setTab] = useState<'my' | 'discover'>('my');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupIsPublic, setNewGroupIsPublic] = useState(true);

  useEffect(() => {
    fetchMyGroups();
    fetchPublicGroups();
  }, [fetchMyGroups, fetchPublicGroups]);

  const handleViewGroup = (group: StudyGroup) => {
    // Navigate to group details
    navigate(`/study-groups/${group.id}`);
  };

  const handleJoinGroup = async (groupId: string) => {
    const success = await joinGroup(groupId);
    if (success) {
      toast.showSuccess('Joined Group!', 'Welcome to the study group');
    } else {
      toast.showError('Failed', 'Could not join group');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    const groupId = await createGroup({
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || undefined,
      isPublic: newGroupIsPublic,
    });

    if (groupId) {
      toast.showSuccess('Group Created!', 'Your study group is ready');
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
    } else {
      toast.showError('Failed', 'Could not create group');
    }
  };

  const availablePublicGroups = publicGroups.filter(
    (pg) => !myGroups.some((mg) => mg.id === pg.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Study Groups</h1>
              <p className="text-gray-500">Learn together, achieve more</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Group
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('my')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              tab === 'my'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            My Groups ({myGroups.length})
          </button>
          <button
            onClick={() => setTab('discover')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              tab === 'discover'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            Discover
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {tab === 'my' && (
              <div className="space-y-4">
                {myGroups.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-1">No groups yet</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      Create a group or join an existing one
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Create Your First Group
                    </button>
                  </div>
                ) : (
                  myGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isOwner={group.ownerId === user?.id}
                      onView={handleViewGroup}
                    />
                  ))
                )}
              </div>
            )}

            {tab === 'discover' && (
              <div className="space-y-4">
                {availablePublicGroups.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border">
                    <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-1">No public groups available</h3>
                    <p className="text-gray-500 text-sm">Be the first to create one!</p>
                  </div>
                ) : (
                  availablePublicGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isOwner={false}
                      onView={handleViewGroup}
                      onJoin={handleJoinGroup}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Create Study Group</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., WASSCE Math Masters"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="What is this group about?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-900">Public Group</div>
                  <div className="text-sm text-gray-500">Anyone can find and join</div>
                </div>
                <button
                  onClick={() => setNewGroupIsPublic(!newGroupIsPublic)}
                  className={cn(
                    'w-12 h-7 rounded-full transition-colors relative',
                    newGroupIsPublic ? 'bg-indigo-600' : 'bg-gray-300'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-1 w-5 h-5 bg-white rounded-full transition-all',
                      newGroupIsPublic ? 'left-6' : 'left-1'
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
