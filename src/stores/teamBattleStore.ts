import { create } from 'zustand';
import { api } from '@/lib/api';
import type { Question, Difficulty } from '@/types';

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  isReady: boolean;
  isOnline: boolean;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
}

export interface BattleTeam {
  id: string;
  name?: string;
  members: TeamMember[];
  totalScore: number;
  captain?: string;
}

export type TeamBattleStatus = 'forming' | 'waiting' | 'matched' | 'active' | 'completed';

export interface TeamBattle {
  id: string;
  team1: BattleTeam;
  team2: BattleTeam;
  status: TeamBattleStatus;
  subjectId?: string;
  subjectName?: string;
  difficulty: Difficulty;
  questionCount: number;
  currentQuestionIndex: number;
  questions?: Question[];
  timePerQuestion: number; // seconds
  team1Score: number;
  team2Score: number;
  winnerId?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface TeamBattleInvite {
  id: string;
  battleId: string;
  teamId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
}

interface TeamBattleState {
  // Current battle
  currentTeamBattle: TeamBattle | null;
  myTeam: BattleTeam | null;
  myTeamId: string | null;

  // Lobbies & Matchmaking
  availableTeamBattles: TeamBattle[];
  pendingInvites: TeamBattleInvite[];
  sentInvites: TeamBattleInvite[];

  // Game state
  currentQuestion: Question | null;
  timeRemaining: number;
  isAnswerLocked: boolean;
  selectedAnswer: string | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  createTeamBattle: (options: {
    members: string[];
    subjectId?: string;
    difficulty?: Difficulty;
  }) => Promise<TeamBattle>;
  joinTeamBattle: (battleId: string, teamId: string) => Promise<void>;
  inviteToTeam: (battleId: string, userId: string) => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  leaveTeamBattle: (battleId: string) => Promise<void>;
  toggleReady: () => Promise<void>;
  submitTeamAnswer: (answer: string) => Promise<{
    isCorrect: boolean;
    correctAnswer: string;
    pointsEarned: number;
  }>;
  fetchAvailableTeamBattles: () => Promise<void>;
  fetchPendingInvites: () => Promise<void>;

  // Local state
  setSelectedAnswer: (answer: string | null) => void;
  updateTimeRemaining: (time: number) => void;
  resetTeamBattle: () => void;
  clearError: () => void;
}

// Mock team names
const teamNames = [
  'Alpha Warriors',
  'Brain Storm',
  'Quiz Masters',
  'Knowledge Knights',
  'Wisdom Wizards',
  'Study Squad',
  'The Scholars',
  'Mind Ninjas',
];

// Generate mock battle data
function generateMockTeamBattle(): TeamBattle {
  const mockUsers = [
    { id: 'u1', name: 'Kwame Asante', level: 15 },
    { id: 'u2', name: 'Ama Mensah', level: 22 },
    { id: 'u3', name: 'Kofi Owusu', level: 18 },
    { id: 'u4', name: 'Akosua Boateng', level: 12 },
    { id: 'u5', name: 'Yaw Adjei', level: 25 },
    { id: 'u6', name: 'Efua Darko', level: 20 },
  ];

  const team1Members = mockUsers.slice(0, 3).map(u => ({
    ...u,
    isReady: Math.random() > 0.3,
    isOnline: true,
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
  }));

  const team2Members = mockUsers.slice(3).map(u => ({
    ...u,
    isReady: Math.random() > 0.3,
    isOnline: true,
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
  }));

  return {
    id: `team_battle_${Date.now()}`,
    team1: {
      id: 'team1',
      name: teamNames[Math.floor(Math.random() * teamNames.length)],
      members: team1Members,
      totalScore: 0,
      captain: team1Members[0].id,
    },
    team2: {
      id: 'team2',
      name: teamNames[Math.floor(Math.random() * teamNames.length)],
      members: team2Members,
      totalScore: 0,
      captain: team2Members[0].id,
    },
    status: 'waiting',
    subjectId: 'mathematics',
    subjectName: 'Mathematics',
    difficulty: 'medium',
    questionCount: 10,
    currentQuestionIndex: 0,
    timePerQuestion: 30,
    team1Score: 0,
    team2Score: 0,
    createdAt: new Date().toISOString(),
  };
}

function generateMockTeamBattles(count: number): TeamBattle[] {
  return Array.from({ length: count }, generateMockTeamBattle);
}

export const useTeamBattleStore = create<TeamBattleState>((set, get) => ({
  currentTeamBattle: null,
  myTeam: null,
  myTeamId: null,
  availableTeamBattles: [],
  pendingInvites: [],
  sentInvites: [],
  currentQuestion: null,
  timeRemaining: 30,
  isAnswerLocked: false,
  selectedAnswer: null,
  isLoading: false,
  error: null,

  createTeamBattle: async (options) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post<TeamBattle>('/team-battles', options);

      if (response.success && response.data) {
        set({
          currentTeamBattle: response.data,
          myTeam: response.data.team1,
          myTeamId: response.data.team1.id,
          isLoading: false,
        });
        return response.data;
      }

      // Mock for demo
      const mockBattle = generateMockTeamBattle();
      mockBattle.status = 'forming';
      set({
        currentTeamBattle: mockBattle,
        myTeam: mockBattle.team1,
        myTeamId: mockBattle.team1.id,
        isLoading: false,
      });
      return mockBattle;
    } catch {
      const mockBattle = generateMockTeamBattle();
      mockBattle.status = 'forming';
      set({
        currentTeamBattle: mockBattle,
        myTeam: mockBattle.team1,
        myTeamId: mockBattle.team1.id,
        isLoading: false,
      });
      return mockBattle;
    }
  },

  joinTeamBattle: async (battleId, teamId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post(`/team-battles/${battleId}/join`, { teamId });

      if (response.success) {
        // Fetch updated battle
        await get().fetchAvailableTeamBattles();
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to join team battle',
        isLoading: false,
      });
    }
  },

  inviteToTeam: async (battleId, userId) => {
    try {
      const response = await api.post(`/team-battles/${battleId}/invite`, { userId });

      if (response.success) {
        // Update sent invites
        const invite: TeamBattleInvite = {
          id: `invite_${Date.now()}`,
          battleId,
          teamId: get().myTeamId || '',
          fromUserId: 'current_user',
          fromUserName: 'You',
          toUserId: userId,
          status: 'pending',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          sentInvites: [...state.sentInvites, invite],
        }));
      }
    } catch (error) {
      console.error('Failed to send invite:', error);
    }
  },

  acceptInvite: async (inviteId) => {
    try {
      const response = await api.post(`/team-battles/invites/${inviteId}/accept`);

      if (response.success) {
        set((state) => ({
          pendingInvites: state.pendingInvites.filter(i => i.id !== inviteId),
        }));
      }
    } catch (error) {
      console.error('Failed to accept invite:', error);
    }
  },

  declineInvite: async (inviteId) => {
    try {
      await api.post(`/team-battles/invites/${inviteId}/decline`);
      set((state) => ({
        pendingInvites: state.pendingInvites.filter(i => i.id !== inviteId),
      }));
    } catch (error) {
      console.error('Failed to decline invite:', error);
    }
  },

  leaveTeamBattle: async (battleId) => {
    try {
      await api.post(`/team-battles/${battleId}/leave`);
      set({
        currentTeamBattle: null,
        myTeam: null,
        myTeamId: null,
      });
    } catch {
      set({
        currentTeamBattle: null,
        myTeam: null,
        myTeamId: null,
      });
    }
  },

  toggleReady: async () => {
    const { currentTeamBattle, myTeamId } = get();
    if (!currentTeamBattle || !myTeamId) return;

    try {
      await api.post(`/team-battles/${currentTeamBattle.id}/ready`);

      // Update local state
      const teamKey = myTeamId === currentTeamBattle.team1.id ? 'team1' : 'team2';
      set((state) => {
        if (!state.currentTeamBattle) return state;

        const updatedTeam = {
          ...state.currentTeamBattle[teamKey],
          members: state.currentTeamBattle[teamKey].members.map((m) =>
            m.id === 'current_user' ? { ...m, isReady: !m.isReady } : m
          ),
        };

        return {
          currentTeamBattle: {
            ...state.currentTeamBattle,
            [teamKey]: updatedTeam,
          },
        };
      });
    } catch (error) {
      console.error('Failed to toggle ready:', error);
    }
  },

  submitTeamAnswer: async (answer) => {
    const { currentTeamBattle, currentQuestion } = get();
    if (!currentTeamBattle || !currentQuestion) {
      throw new Error('No active battle or question');
    }

    set({ isAnswerLocked: true, selectedAnswer: answer });

    try {
      const response = await api.post<{
        isCorrect: boolean;
        correctAnswer: string;
        pointsEarned: number;
      }>(`/team-battles/${currentTeamBattle.id}/answer`, {
        questionIndex: currentTeamBattle.currentQuestionIndex,
        answer,
      });

      if (response.success && response.data) {
        return response.data;
      }

      // Mock response
      const isCorrect = answer === currentQuestion.correctAnswer;
      return {
        isCorrect,
        correctAnswer: currentQuestion.correctAnswer || '',
        pointsEarned: isCorrect ? 10 : 0,
      };
    } catch {
      const isCorrect = answer === currentQuestion?.correctAnswer;
      return {
        isCorrect,
        correctAnswer: currentQuestion?.correctAnswer || '',
        pointsEarned: isCorrect ? 10 : 0,
      };
    }
  },

  fetchAvailableTeamBattles: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<{ battles: TeamBattle[] }>('/team-battles/available');

      if (response.success && response.data) {
        set({
          availableTeamBattles: response.data.battles,
          isLoading: false,
        });
      } else {
        // Mock data
        set({
          availableTeamBattles: generateMockTeamBattles(3),
          isLoading: false,
        });
      }
    } catch {
      set({
        availableTeamBattles: generateMockTeamBattles(3),
        isLoading: false,
      });
    }
  },

  fetchPendingInvites: async () => {
    try {
      const response = await api.get<{ invites: TeamBattleInvite[] }>('/team-battles/invites');

      if (response.success && response.data) {
        set({ pendingInvites: response.data.invites });
      }
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  },

  setSelectedAnswer: (answer) => set({ selectedAnswer: answer }),
  updateTimeRemaining: (time) => set({ timeRemaining: time }),

  resetTeamBattle: () => set({
    currentTeamBattle: null,
    myTeam: null,
    myTeamId: null,
    currentQuestion: null,
    timeRemaining: 30,
    isAnswerLocked: false,
    selectedAnswer: null,
    error: null,
  }),

  clearError: () => set({ error: null }),
}));

// Helper: Get team color classes
export function getTeamColors(teamIndex: 1 | 2) {
  return teamIndex === 1
    ? {
        bg: 'bg-blue-500',
        bgLight: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-600',
      }
    : {
        bg: 'bg-red-500',
        bgLight: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-600',
      };
}
