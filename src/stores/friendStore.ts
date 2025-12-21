import { create } from 'zustand';
import type { Friend, FriendChallenge, ChallengeType } from '@/types';
import { api } from '@/lib/api';

interface FriendState {
  friends: Friend[];
  pendingRequests: Friend[];
  sentRequests: Friend[];
  challenges: FriendChallenge[];
  activeChallenges: FriendChallenge[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFriends: () => Promise<void>;
  fetchChallenges: () => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<boolean>;
  acceptFriendRequest: (friendshipId: string) => Promise<boolean>;
  declineFriendRequest: (friendshipId: string) => Promise<boolean>;
  removeFriend: (friendshipId: string) => Promise<boolean>;
  createChallenge: (
    friendId: string,
    type: ChallengeType,
    options?: { subjectId?: string; topicId?: string; targetValue?: number; durationHours?: number; xpWager?: number }
  ) => Promise<boolean>;
  acceptChallenge: (challengeId: string) => Promise<boolean>;
  declineChallenge: (challengeId: string) => Promise<boolean>;
  searchUsers: (query: string) => Promise<Friend[]>;
  clearError: () => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  challenges: [],
  activeChallenges: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{
        friends: Array<{
          id: string;
          user_id: string;
          name: string;
          avatar?: string;
          house?: string;
          level: number;
          xp_points: number;
          status: string;
          last_active?: string;
        }>;
        pending: Array<{
          id: string;
          user_id: string;
          name: string;
          avatar?: string;
          house?: string;
          level: number;
          xp_points: number;
        }>;
        sent: Array<{
          id: string;
          user_id: string;
          name: string;
          avatar?: string;
        }>;
      }>('/friends');

      if (response.success && response.data) {
        set({
          friends: response.data.friends.map((f) => ({
            id: f.id,
            odUserId: f.user_id,
            odName: f.name,
            avatar: f.avatar,
            house: f.house,
            level: f.level,
            xp: f.xp_points,
            status: 'accepted' as const,
            lastActive: f.last_active,
          })),
          pendingRequests: response.data.pending.map((f) => ({
            id: f.id,
            odUserId: f.user_id,
            odName: f.name,
            avatar: f.avatar,
            house: f.house,
            level: f.level,
            xp: f.xp_points,
            status: 'pending' as const,
          })),
          sentRequests: response.data.sent.map((f) => ({
            id: f.id,
            odUserId: f.user_id,
            odName: f.name,
            avatar: f.avatar,
            house: undefined,
            level: 1,
            xp: 0,
            status: 'pending' as const,
          })),
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch friends',
        isLoading: false,
      });
    }
  },

  fetchChallenges: async () => {
    try {
      const response = await api.get<{
        challenges: Array<{
          id: string;
          challenger_id: string;
          challenged_id: string;
          challenger_name: string;
          challenged_name: string;
          challenge_type: string;
          subject_id?: string;
          topic_id?: string;
          target_value?: number;
          duration_hours: number;
          status: string;
          challenger_progress: number;
          challenged_progress: number;
          winner_id?: string;
          xp_wager: number;
          created_at: string;
          started_at?: string;
          ends_at?: string;
        }>;
      }>('/friends/challenges');

      if (response.success && response.data) {
        const challenges: FriendChallenge[] = response.data.challenges.map((c) => ({
          id: c.id,
          challengerId: c.challenger_id,
          challengedId: c.challenged_id,
          challengerName: c.challenger_name,
          challengedName: c.challenged_name,
          challengeType: c.challenge_type as ChallengeType,
          subjectId: c.subject_id,
          topicId: c.topic_id,
          targetValue: c.target_value,
          durationHours: c.duration_hours,
          status: c.status as FriendChallenge['status'],
          challengerProgress: c.challenger_progress,
          challengedProgress: c.challenged_progress,
          winnerId: c.winner_id,
          xpWager: c.xp_wager,
          createdAt: c.created_at,
          startedAt: c.started_at,
          endsAt: c.ends_at,
        }));

        set({
          challenges,
          activeChallenges: challenges.filter((c) => c.status === 'active'),
        });
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    }
  },

  sendFriendRequest: async (userId) => {
    try {
      const response = await api.post('/friends/request', { friend_id: userId });
      if (response.success) {
        get().fetchFriends();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      return false;
    }
  },

  acceptFriendRequest: async (friendshipId) => {
    try {
      const response = await api.post(`/friends/${friendshipId}/accept`);
      if (response.success) {
        get().fetchFriends();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      return false;
    }
  },

  declineFriendRequest: async (friendshipId) => {
    try {
      const response = await api.post(`/friends/${friendshipId}/decline`);
      if (response.success) {
        get().fetchFriends();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      return false;
    }
  },

  removeFriend: async (friendshipId) => {
    try {
      const response = await api.delete(`/friends/${friendshipId}`);
      if (response.success) {
        set((state) => ({
          friends: state.friends.filter((f) => f.id !== friendshipId),
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove friend:', error);
      return false;
    }
  },

  createChallenge: async (friendId, type, options = {}) => {
    try {
      const response = await api.post('/friends/challenges', {
        friend_id: friendId,
        challenge_type: type,
        subject_id: options.subjectId,
        topic_id: options.topicId,
        target_value: options.targetValue,
        duration_hours: options.durationHours || 24,
        xp_wager: options.xpWager || 50,
      });

      if (response.success) {
        get().fetchChallenges();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create challenge:', error);
      return false;
    }
  },

  acceptChallenge: async (challengeId) => {
    try {
      const response = await api.post(`/friends/challenges/${challengeId}/accept`);
      if (response.success) {
        get().fetchChallenges();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to accept challenge:', error);
      return false;
    }
  },

  declineChallenge: async (challengeId) => {
    try {
      const response = await api.post(`/friends/challenges/${challengeId}/decline`);
      if (response.success) {
        get().fetchChallenges();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to decline challenge:', error);
      return false;
    }
  },

  searchUsers: async (query) => {
    try {
      const response = await api.get<{
        users: Array<{
          id: string;
          name: string;
          avatar?: string;
          house?: string;
          level: number;
          xp_points: number;
        }>;
      }>(`/users/search?q=${encodeURIComponent(query)}`);

      if (response.success && response.data) {
        return response.data.users.map((u) => ({
          id: u.id,
          odUserId: u.id,
          odName: u.name,
          avatar: u.avatar,
          house: u.house,
          level: u.level,
          xp: u.xp_points,
          status: 'pending' as const,
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  },

  clearError: () => set({ error: null }),
}));
