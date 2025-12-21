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
  fetchGroupDetails: (groupId: string) => Promise<void>;
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
      const response = await api.get<{
        groups: Array<{
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
        }>;
      }>('/study-groups/my');

      if (response.success && response.data) {
        set({
          myGroups: response.data.groups.map((g) => ({
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
          })),
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch groups',
        isLoading: false,
      });
    }
  },

  fetchPublicGroups: async () => {
    try {
      const response = await api.get<{
        groups: Array<{
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
        }>;
      }>('/study-groups/public');

      if (response.success && response.data) {
        set({
          publicGroups: response.data.groups.map((g) => ({
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
          })),
        });
      }
    } catch (error) {
      console.error('Failed to fetch public groups:', error);
    }
  },

  fetchGroupDetails: async (groupId) => {
    try {
      const response = await api.get<{
        group: {
          id: string;
          name: string;
          description?: string;
          icon: string;
          color: string;
          owner_id: string;
          subject_id?: string;
          is_public: number;
          max_members: number;
          weekly_goal_xp: number;
          created_at: string;
        };
        members: Array<{
          id: string;
          group_id: string;
          user_id: string;
          user_name: string;
          user_avatar?: string;
          role: string;
          weekly_xp_contribution: number;
          joined_at: string;
          last_active?: string;
        }>;
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
      }
    } catch (error) {
      console.error('Failed to fetch group details:', error);
    }
  },

  fetchMessages: async (groupId) => {
    try {
      const response = await api.get<{
        messages: Array<{
          id: string;
          group_id: string;
          user_id: string;
          user_name: string;
          user_avatar?: string;
          message: string;
          message_type: string;
          created_at: string;
        }>;
      }>(`/study-groups/${groupId}/messages`);

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
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
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
      return null;
    } catch (error) {
      console.error('Failed to create group:', error);
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
      return false;
    } catch (error) {
      console.error('Failed to update group:', error);
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
      return false;
    } catch (error) {
      console.error('Failed to delete group:', error);
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
      return false;
    } catch (error) {
      console.error('Failed to join group:', error);
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
      return false;
    } catch (error) {
      console.error('Failed to leave group:', error);
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
      return false;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
