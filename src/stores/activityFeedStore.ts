import { create } from 'zustand';
import { api } from '@/lib/api';

export type ActivityType =
  | 'achievement'
  | 'level_up'
  | 'streak'
  | 'battle_win'
  | 'high_score'
  | 'quiz_complete'
  | 'subject_mastery'
  | 'milestone';

export interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userLevel?: number;
  activityType: ActivityType;
  metadata: {
    // For achievements
    achievementName?: string;
    achievementRarity?: 'common' | 'rare' | 'epic' | 'legendary';
    // For level up
    newLevel?: number;
    // For streak
    streakDays?: number;
    // For battle
    opponentName?: string;
    score?: number;
    opponentScore?: number;
    // For high score
    topicName?: string;
    subjectName?: string;
    percentage?: number;
    // For quiz complete
    questionsAnswered?: number;
    accuracy?: number;
    // For subject mastery
    masteryLevel?: number;
    // For milestone
    milestoneName?: string;
    xpEarned?: number;
  };
  createdAt: string;
  isFriend?: boolean;
}

interface ActivityFeedState {
  // Data
  feedItems: ActivityItem[];
  friendActivities: ActivityItem[];
  globalActivities: ActivityItem[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;

  // Actions
  fetchFeed: (limit?: number) => Promise<void>;
  fetchFriendActivities: () => Promise<void>;
  fetchGlobalActivities: () => Promise<void>;
  loadMore: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  clearError: () => void;

  // Local activity creation (for optimistic updates)
  addLocalActivity: (activity: Omit<ActivityItem, 'id' | 'createdAt'>) => void;
}

// Mock data generator for demo
function generateMockActivities(count: number, friendsOnly: boolean = false): ActivityItem[] {
  const mockUsers = [
    { id: 'user1', name: 'Kwame Asante', avatar: undefined, level: 15 },
    { id: 'user2', name: 'Ama Mensah', avatar: undefined, level: 22 },
    { id: 'user3', name: 'Kofi Owusu', avatar: undefined, level: 18 },
    { id: 'user4', name: 'Akosua Boateng', avatar: undefined, level: 12 },
    { id: 'user5', name: 'Yaw Adjei', avatar: undefined, level: 25 },
    { id: 'user6', name: 'Efua Darko', avatar: undefined, level: 20 },
  ];

  const activities: ActivityItem[] = [];
  const activityTypes: ActivityType[] = [
    'achievement', 'level_up', 'streak', 'battle_win',
    'high_score', 'quiz_complete', 'subject_mastery', 'milestone'
  ];

  const achievements = [
    { name: 'First Steps', rarity: 'common' as const },
    { name: 'Week Warrior', rarity: 'common' as const },
    { name: 'Knowledge Seeker', rarity: 'rare' as const },
    { name: 'Speed Demon', rarity: 'epic' as const },
    { name: 'Perfectionist', rarity: 'legendary' as const },
  ];

  const subjects = ['Mathematics', 'English', 'Science', 'Social Studies', 'Biology'];
  const topics = ['Algebra', 'Essay Writing', 'Physics', 'History', 'Chemistry'];

  for (let i = 0; i < count; i++) {
    const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const achievement = achievements[Math.floor(Math.random() * achievements.length)];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    const baseActivity = {
      id: `activity_${Date.now()}_${i}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userLevel: user.level,
      activityType: type,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(), // Last 3 days
      isFriend: friendsOnly || Math.random() > 0.5,
    };

    let metadata: ActivityItem['metadata'] = {};

    switch (type) {
      case 'achievement':
        metadata = {
          achievementName: achievement.name,
          achievementRarity: achievement.rarity,
          xpEarned: achievement.rarity === 'legendary' ? 1000 : achievement.rarity === 'epic' ? 500 : 100,
        };
        break;
      case 'level_up':
        metadata = {
          newLevel: user.level + 1,
          xpEarned: 500,
        };
        break;
      case 'streak':
        metadata = {
          streakDays: Math.floor(Math.random() * 30) + 7,
          xpEarned: 200,
        };
        break;
      case 'battle_win':
        metadata = {
          opponentName: mockUsers[Math.floor(Math.random() * mockUsers.length)].name,
          score: Math.floor(Math.random() * 3) + 3,
          opponentScore: Math.floor(Math.random() * 3),
          xpEarned: 150,
        };
        break;
      case 'high_score':
        metadata = {
          topicName: topic,
          subjectName: subject,
          percentage: Math.floor(Math.random() * 15) + 85,
          xpEarned: 100,
        };
        break;
      case 'quiz_complete':
        metadata = {
          subjectName: subject,
          questionsAnswered: Math.floor(Math.random() * 20) + 10,
          accuracy: Math.floor(Math.random() * 30) + 70,
          xpEarned: 75,
        };
        break;
      case 'subject_mastery':
        metadata = {
          subjectName: subject,
          masteryLevel: Math.floor(Math.random() * 3) + 1,
          xpEarned: 300,
        };
        break;
      case 'milestone':
        metadata = {
          milestoneName: `${Math.floor(Math.random() * 5 + 1) * 100} Questions Answered`,
          xpEarned: 250,
        };
        break;
    }

    activities.push({ ...baseActivity, metadata });
  }

  // Sort by date descending
  return activities.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export const useActivityFeedStore = create<ActivityFeedState>((set, get) => ({
  feedItems: [],
  friendActivities: [],
  globalActivities: [],
  isLoading: false,
  error: null,
  hasMore: true,
  page: 1,

  fetchFeed: async (limit = 20) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{ activities: ActivityItem[] }>(`/activity/feed?limit=${limit}`);

      if (response.success && response.data) {
        set({
          feedItems: response.data.activities,
          isLoading: false,
          page: 1,
          hasMore: response.data.activities.length >= limit,
        });
      } else {
        // Use mock data for demo
        const mockData = generateMockActivities(limit);
        set({
          feedItems: mockData,
          isLoading: false,
          page: 1,
          hasMore: true,
        });
      }
    } catch (error) {
      // Use mock data on error
      const mockData = generateMockActivities(limit);
      set({
        feedItems: mockData,
        isLoading: false,
        page: 1,
        hasMore: true,
      });
    }
  },

  fetchFriendActivities: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{ activities: ActivityItem[] }>('/activity/friends');

      if (response.success && response.data) {
        set({
          friendActivities: response.data.activities,
          isLoading: false,
        });
      } else {
        // Use mock data for demo
        const mockData = generateMockActivities(10, true);
        set({
          friendActivities: mockData,
          isLoading: false,
        });
      }
    } catch (error) {
      // Use mock data on error
      const mockData = generateMockActivities(10, true);
      set({
        friendActivities: mockData,
        isLoading: false,
      });
    }
  },

  fetchGlobalActivities: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{ activities: ActivityItem[] }>('/activity/global');

      if (response.success && response.data) {
        set({
          globalActivities: response.data.activities,
          isLoading: false,
        });
      } else {
        // Use mock data for demo
        const mockData = generateMockActivities(15);
        set({
          globalActivities: mockData,
          isLoading: false,
        });
      }
    } catch (error) {
      // Use mock data on error
      const mockData = generateMockActivities(15);
      set({
        globalActivities: mockData,
        isLoading: false,
      });
    }
  },

  loadMore: async () => {
    const { page, feedItems, hasMore } = get();
    if (!hasMore) return;

    set({ isLoading: true });

    try {
      const response = await api.get<{ activities: ActivityItem[] }>(
        `/activity/feed?page=${page + 1}&limit=20`
      );

      if (response.success && response.data) {
        set({
          feedItems: [...feedItems, ...response.data.activities],
          page: page + 1,
          hasMore: response.data.activities.length >= 20,
          isLoading: false,
        });
      } else {
        // Generate more mock data
        const mockData = generateMockActivities(10);
        set({
          feedItems: [...feedItems, ...mockData],
          page: page + 1,
          hasMore: page < 3, // Limit mock pages
          isLoading: false,
        });
      }
    } catch (error) {
      // Generate more mock data on error
      const mockData = generateMockActivities(10);
      set({
        feedItems: [...feedItems, ...mockData],
        page: page + 1,
        hasMore: page < 3,
        isLoading: false,
      });
    }
  },

  refreshFeed: async () => {
    set({ page: 1, hasMore: true });
    await get().fetchFeed();
  },

  clearError: () => set({ error: null }),

  addLocalActivity: (activity) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: `local_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      feedItems: [newActivity, ...state.feedItems],
      friendActivities: activity.isFriend
        ? [newActivity, ...state.friendActivities]
        : state.friendActivities,
    }));
  },
}));

// Helper function to format activity message
export function getActivityMessage(activity: ActivityItem): string {
  const { activityType, metadata, userName } = activity;

  switch (activityType) {
    case 'achievement':
      return `${userName} unlocked "${metadata.achievementName}"`;
    case 'level_up':
      return `${userName} reached Level ${metadata.newLevel}!`;
    case 'streak':
      return `${userName} hit a ${metadata.streakDays}-day streak!`;
    case 'battle_win':
      return `${userName} won a battle vs ${metadata.opponentName} (${metadata.score}-${metadata.opponentScore})`;
    case 'high_score':
      return `${userName} scored ${metadata.percentage}% on ${metadata.topicName}`;
    case 'quiz_complete':
      return `${userName} completed a ${metadata.subjectName} quiz (${metadata.accuracy}% accuracy)`;
    case 'subject_mastery':
      return `${userName} reached mastery level ${metadata.masteryLevel} in ${metadata.subjectName}`;
    case 'milestone':
      return `${userName} achieved ${metadata.milestoneName}!`;
    default:
      return `${userName} completed an activity`;
  }
}

// Helper function to get activity icon
export function getActivityIcon(activityType: ActivityType): string {
  switch (activityType) {
    case 'achievement':
      return 'Trophy';
    case 'level_up':
      return 'TrendingUp';
    case 'streak':
      return 'Flame';
    case 'battle_win':
      return 'Swords';
    case 'high_score':
      return 'Star';
    case 'quiz_complete':
      return 'CheckCircle';
    case 'subject_mastery':
      return 'Award';
    case 'milestone':
      return 'Flag';
    default:
      return 'Activity';
  }
}

// Helper function to get relative time
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
