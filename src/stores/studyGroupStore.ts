import { create } from 'zustand';
import type { StudyGroup, StudyGroupMember, StudyGroupMessage } from '@/types';
import { api } from '@/lib/api';

interface StudyGroupState {
  myGroups: StudyGroup[];
  publicGroups: StudyGroup[];
  currentGroup: StudyGroup | null;
  members: StudyGroupMember[];
  messages: StudyGroupMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMyGroups: () => Promise<void>;
  fetchPublicGroups: () => Promise<void>;
  fetchGroupDetails: (groupId: string) => Promise<boolean>;
  fetchMessages: (groupId: string) => Promise<void>;
  createGroup: (data: {
    name: string;
    description?: string;
    subjectId?: string;
    isPublic?: boolean;
    maxMembers?: number;
    weeklyGoalXp?: number;
  }) => Promise<string | null>;
  updateGroup: (groupId: string, updates: Partial<StudyGroup>) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  joinGroup: (groupId: string) => Promise<boolean>;
  leaveGroup: (groupId: string) => Promise<boolean>;
  sendMessage: (groupId: string, message: string) => Promise<boolean>;
  clearError: () => void;
}

interface GroupRow {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  owner_id: string;
  subject_id?: string;
  is_public: number;
  max_members: number;
  member_count: number;
  weekly_goal_xp: number;
  weekly_progress: number;
  created_at: string;
}

interface MemberRow {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  role: string;
  weekly_xp_contribution: number;
  joined_at: string;
  last_active?: string;
}

interface MessageRow {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  message_type: string;
  created_at: string;
}

function mapGroup(g: GroupRow): StudyGroup {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    icon: g.icon,
    color: g.color,
    ownerId: g.owner_id,
    subjectId: g.subject_id,
    isPublic: !!g.is_public,
    maxMembers: g.max_members,
    memberCount: g.member_count,
    weeklyGoalXp: g.weekly_goal_xp,
    weeklyProgress: g.weekly_progress,
    createdAt: g.created_at,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const useStudyGroupStore = create<StudyGroupState>((set, get) => ({
  myGroups: [],
  publicGroups: [],
  currentGroup: null,
  members: [],
  messages: [],
  isLoading: false,
  error: null,

  fetchMyGroups: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{ groups: GroupRow[] }>('/study-groups/my');

      if (response.success && response.data) {
        set({ myGroups: response.data.groups.map(mapGroup), isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch groups', isLoading: false });
      }
    } catch (error) {
      set({ error: errorMessage(error, 'Failed to fetch groups'), isLoading: false });
    }
  },

  fetchPublicGroups: async () => {
    try {
      const response = await api.get<{ groups: GroupRow[] }>('/study-groups/public');

      if (response.success && response.data) {
        set({ publicGroups: response.data.groups.map(mapGroup) });
      } else {
        set({ error: response.error || 'Failed to fetch public groups' });
      }
    } catch (error) {
      set({ error: errorMessage(error, 'Failed to fetch public groups') });
    }
  },

  fetchGroupDetails: async (groupId) => {
    try {
      const response = await api.get<{
        group: Omit<GroupRow, 'member_count' | 'weekly_progress'>;
        members: MemberRow[];
      }>(`/study-groups/${groupId}`);

      if (response.success && response.data) {
        const g = response.data.group;
        const totalProgress = response.data.members.reduce(
          (sum, m) => sum + m.weekly_xp_contribution,
          0
        );

        set({
          currentGroup: {
            id: g.id,
            name: g.name,
            description: g.description,
            icon: g.icon,
            color: g.color,
            ownerId: g.owner_id,
            subjectId: g.subject_id,
            isPublic: !!g.is_public,
            maxMembers: g.max_members,
            memberCount: response.data.members.length,
            weeklyGoalXp: g.weekly_goal_xp,
            weeklyProgress: totalProgress,
            createdAt: g.created_at,
          },
          members: response.data.members.map((m) => ({
            id: m.id,
            groupId: m.group_id,
            userId: m.user_id,
            userName: m.user_name,
            userAvatar: m.user_avatar,
            role: m.role as StudyGroupMember['role'],
            weeklyXpContribution: m.weekly_xp_contribution,
            joinedAt: m.joined_at,
            lastActive: m.last_active,
          })),
        });
        return true;
      }
      set({ error: response.error || 'Failed to fetch group details' });
      return false;
    } catch (error) {
      set({ error: errorMessage(error, 'Failed to fetch group details') });
      return false;
    }
  },

  fetchMessages: async (groupId) => {
    try {
      const response = await api.get<{ messages: MessageRow[] }>(
        `/study-groups/${groupId}/messages`
      );

      if (response.success && response.data) {
        set({
          messages: response.data.messages.map((m) => ({
            id: m.id,
            groupId: m.group_id,
            userId: m.user_id,
            userName: m.user_name,
            userAvatar: m.user_avatar,
            message: m.message,
            messageType: m.message_type as StudyGroupMessage['messageType'],
            createdAt: m.created_at,
          })),
        });
      } else {
        set({ error: response.error || 'Failed to fetch messages' });
      }
    } catch (error) {
      set({ error: errorMessage(error, 'Failed to fetch messages') });
    }
  },

  createGroup: async (data) => {
    try {
      const response = await api.post<{ group_id: string }>('/study-groups', {
        name: data.name,
        description: data.description,
        subject_id: data.subjectId,
        is_public: data.isPublic ?? true,
        max_members: data.maxMembers ?? 20,
        weekly_goal_xp: data.weeklyGoalXp ?? 1000,
      });

      if (response.success && response.data) {
        get().fetchMyGroups();
        return response.data.group_id;
      }
      set({ error: response.error || 'Failed to create group' });
      return null;
    } catch (error) {
      set({ error: errorMessage(error, 'Failed to create group') });
      return null;
    }
  },

  updateGroup: async (groupId, updates) => {
    try {
      const response = await api.put(`/study-groups/${groupId}`, {
        name: updates.name,
        description: updates.description,
        is_public: updates.isPublic,
        max_members: updates.maxMembers,
        weekly_goal_xp: updates.weeklyGoalXp,
      });

      if (response.success) {
        get().fetchMyGroups();
        return true;
      }
      set({ error: response.error || 'Failed to update group' });
      return false;
    } catch (error) {
      set({ error: errorMessage(error, 'Failed to update group') });
      return false;
    }
  },

  deleteGroup: async (groupId) => {
    try {
      const response = await api.delete(`/study-groups/${groupId}`);
      if (response.success) {
        set((state) => ({
          myGroups: state.myGroups.filter((g) => g.id !== groupId),
        }));
        return true;
      }
      set({ error: response.error || 'Failed to delete group' });
      return false;
    } catch (error) {
      set({ error: errorMessage(error, 'Failed to delete group') });
      return false;
    }
  },

  joinGroup: async (groupId) => {
    try {
      const response = await api.post(`/study-groups/${groupId}/join`);
      if (response.success) {
        get().fetchMyGroups();
        get().fetchPublicGroups();
        return true;
      }
      set({ error: response.error || 'Failed to join group' });
      return false;
    } catch (error) {
      set({ error: errorMessage(error, 'Failed to join group') });
      return false;
    }
  },

  leaveGroup: async (groupId) => {
    try {
      const response = await api.post(`/study-groups/${groupId}/leave`);
      if (response.success) {
        set((state) => ({
          myGroups: state.myGroups.filter((g) => g.id !== groupId),
        }));
        return true;
      }
      set({ error: response.error || 'Failed to leave group' });
      return false;
    } catch (error) {
      set({ error: errorMessage(error, 'Failed to leave group') });
      return false;
    }
  },

  sendMessage: async (groupId, message) => {
    try {
      const response = await api.post(`/study-groups/${groupId}/messages`, { message });
      if (response.success) {
        get().fetchMessages(groupId);
        return true;
      }
      set({ error: response.error || 'Failed to send message' });
      return false;
    } catch (error) {
      set({ error: errorMessage(error, 'Failed to send message') });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
