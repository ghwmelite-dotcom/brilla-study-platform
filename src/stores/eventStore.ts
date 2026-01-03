import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { useExamStore } from './examStore';
import type { ExamTypeSlug } from '@/types';

export type EventTheme = 'wassce_prep' | 'bece_prep' | 'nsmq_prep' | 'house_cup' | 'subject_week' | 'holiday' | 'special';
export type TournamentType = 'bracket' | 'leaderboard' | 'team';
export type TournamentStatus = 'upcoming' | 'registration' | 'active' | 'completed';

export interface EventReward {
  id: string;
  type: 'xp' | 'badge' | 'cosmetic' | 'protection' | 'title';
  value: number | string;
  name: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  imageUrl?: string;
}

export interface EventQuest {
  id: string;
  name: string;
  description: string;
  requirement: {
    type: 'questions_answered' | 'accuracy' | 'streak' | 'battles_won' | 'time_spent' | 'subjects_practiced';
    value: number;
    subjectId?: string;
  };
  reward: EventReward;
  progress: number;
  isCompleted: boolean;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  theme: EventTheme;
  startDate: string;
  endDate: string;
  rewards: EventReward[];
  quests: EventQuest[];
  xpMultiplier: number;
  bannerImageUrl?: string;
  accentColor: string;
  isActive: boolean;
  userProgress?: {
    questsCompleted: number;
    totalQuests: number;
    xpEarned: number;
    rewardsClaimed: string[];
  };
}

export interface TournamentRound {
  id: string;
  roundNumber: number;
  matches: TournamentMatch[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCompleted: boolean;
}

export interface TournamentMatch {
  id: string;
  participant1: TournamentParticipant;
  participant2?: TournamentParticipant;
  score1?: number;
  score2?: number;
  winnerId?: string;
  status: 'pending' | 'active' | 'completed';
  scheduledAt?: string;
}

export interface TournamentParticipant {
  id: string;
  name: string;
  avatar?: string;
  seed?: number;
  wins: number;
  losses: number;
}

export interface Prize {
  rank: number | string; // 1, 2, 3 or '4-10'
  rewards: EventReward[];
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  type: TournamentType;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  registrationEndDate: string;
  maxParticipants: number;
  currentParticipants: number;
  prizes: Prize[];
  rounds?: TournamentRound[];
  leaderboard?: TournamentParticipant[];
  userRegistered: boolean;
  userPosition?: number;
  entryFee?: number; // in coins
  subjectId?: string;
  subjectName?: string;
}

interface EventState {
  // Data
  activeEvents: SeasonalEvent[];
  upcomingEvents: SeasonalEvent[];
  activeTournament: Tournament | null;
  availableTournaments: Tournament[];
  userEventProgress: Record<string, { questsCompleted: number; xpEarned: number }>;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchActiveEvents: () => Promise<void>;
  fetchTournaments: () => Promise<void>;
  joinTournament: (tournamentId: string) => Promise<boolean>;
  claimEventReward: (eventId: string, rewardId: string) => Promise<boolean>;
  updateQuestProgress: (eventId: string, questId: string, progress: number) => void;
  clearError: () => void;

  // Computed
  getTimeRemaining: (endDate: string) => { days: number; hours: number; minutes: number };
  getCurrentXPMultiplier: () => number;
}

// Mock data for demo - generates exam-appropriate events
function generateMockEvents(examType: ExamTypeSlug): SeasonalEvent[] {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Generate exam-specific countdown event
  const examEvents: Record<ExamTypeSlug, SeasonalEvent> = {
    bece: {
      id: 'bece_countdown_2026',
      name: 'BECE Prep Challenge 2026',
      description: 'Get ready for your BECE exams! Complete quests and earn 2x XP on all activities!',
      theme: 'bece_prep',
      startDate: now.toISOString(),
      endDate: monthFromNow.toISOString(),
      xpMultiplier: 2,
      accentColor: '#3B82F6',
      isActive: true,
      bannerImageUrl: undefined,
      rewards: [
        { id: 'bece_badge', type: 'badge', value: 'bece_champion', name: 'BECE Champion Badge', rarity: 'epic' },
        { id: 'bece_xp', type: 'xp', value: 3000, name: '3000 Bonus XP' },
        { id: 'bece_protection', type: 'protection', value: 5, name: '5 Streak Protections', rarity: 'rare' },
      ],
      quests: [
        {
          id: 'bece_q1',
          name: 'Number Cruncher',
          description: 'Answer 50 Mathematics questions',
          requirement: { type: 'questions_answered', value: 50, subjectId: 'mathematics' },
          reward: { id: 'r1', type: 'xp', value: 300, name: '300 XP' },
          progress: 45,
          isCompleted: false,
        },
        {
          id: 'bece_q2',
          name: 'Science Explorer',
          description: 'Achieve 70% accuracy in Integrated Science',
          requirement: { type: 'accuracy', value: 70, subjectId: 'integrated_science' },
          reward: { id: 'r2', type: 'xp', value: 250, name: '250 XP' },
          progress: 75,
          isCompleted: false,
        },
        {
          id: 'bece_q3',
          name: 'Consistent Learner',
          description: 'Maintain a 7-day study streak',
          requirement: { type: 'streak', value: 7 },
          reward: { id: 'r3', type: 'protection', value: 2, name: '2 Streak Protections' },
          progress: 50,
          isCompleted: false,
        },
        {
          id: 'bece_q4',
          name: 'Subject Star',
          description: 'Practice all 4 core BECE subjects',
          requirement: { type: 'subjects_practiced', value: 4 },
          reward: { id: 'r4', type: 'badge', value: 'subject_star', name: 'Subject Star Badge', rarity: 'rare' },
          progress: 60,
          isCompleted: false,
        },
      ],
      userProgress: {
        questsCompleted: 0,
        totalQuests: 4,
        xpEarned: 800,
        rewardsClaimed: [],
      },
    },
    wassce: {
      id: 'wassce_countdown_2026',
      name: 'WASSCE Countdown 2026',
      description: 'Prepare for your WASSCE exams with special quests and 2x XP on all activities!',
      theme: 'wassce_prep',
      startDate: now.toISOString(),
      endDate: monthFromNow.toISOString(),
      xpMultiplier: 2,
      accentColor: '#10B981',
      isActive: true,
      bannerImageUrl: undefined,
      rewards: [
        { id: 'wassce_badge', type: 'badge', value: 'wassce_champion', name: 'WASSCE Champion Badge', rarity: 'epic' },
        { id: 'wassce_xp', type: 'xp', value: 5000, name: '5000 Bonus XP' },
        { id: 'wassce_protection', type: 'protection', value: 5, name: '5 Streak Protections', rarity: 'rare' },
      ],
      quests: [
        {
          id: 'wassce_q1',
          name: 'Math Master',
          description: 'Answer 100 Mathematics questions',
          requirement: { type: 'questions_answered', value: 100, subjectId: 'mathematics' },
          reward: { id: 'r1', type: 'xp', value: 500, name: '500 XP' },
          progress: 45,
          isCompleted: false,
        },
        {
          id: 'wassce_q2',
          name: 'Science Scholar',
          description: 'Achieve 80% accuracy in Science',
          requirement: { type: 'accuracy', value: 80, subjectId: 'science' },
          reward: { id: 'r2', type: 'xp', value: 300, name: '300 XP' },
          progress: 75,
          isCompleted: false,
        },
        {
          id: 'wassce_q3',
          name: 'Streak Champion',
          description: 'Maintain a 14-day study streak',
          requirement: { type: 'streak', value: 14 },
          reward: { id: 'r3', type: 'protection', value: 2, name: '2 Streak Protections' },
          progress: 50,
          isCompleted: false,
        },
        {
          id: 'wassce_q4',
          name: 'All-Rounder',
          description: 'Practice all 5 core subjects',
          requirement: { type: 'subjects_practiced', value: 5 },
          reward: { id: 'r4', type: 'badge', value: 'all_rounder', name: 'All-Rounder Badge', rarity: 'rare' },
          progress: 60,
          isCompleted: false,
        },
      ],
      userProgress: {
        questsCompleted: 0,
        totalQuests: 4,
        xpEarned: 1250,
        rewardsClaimed: [],
      },
    },
    nsmq: {
      id: 'nsmq_training_2026',
      name: 'NSMQ Training Camp 2026',
      description: 'Sharpen your quiz skills! Speed drills, science challenges, and 2x XP await!',
      theme: 'nsmq_prep',
      startDate: now.toISOString(),
      endDate: monthFromNow.toISOString(),
      xpMultiplier: 2,
      accentColor: '#F59E0B',
      isActive: true,
      bannerImageUrl: undefined,
      rewards: [
        { id: 'nsmq_badge', type: 'badge', value: 'nsmq_champion', name: 'Quiz Champion Badge', rarity: 'epic' },
        { id: 'nsmq_xp', type: 'xp', value: 5000, name: '5000 Bonus XP' },
        { id: 'nsmq_title', type: 'title', value: 'Speed Demon', name: 'Speed Demon Title', rarity: 'legendary' },
      ],
      quests: [
        {
          id: 'nsmq_q1',
          name: 'Speed Solver',
          description: 'Answer 50 questions in under 10 seconds each',
          requirement: { type: 'questions_answered', value: 50 },
          reward: { id: 'r1', type: 'xp', value: 500, name: '500 XP' },
          progress: 30,
          isCompleted: false,
        },
        {
          id: 'nsmq_q2',
          name: 'Science Ace',
          description: 'Achieve 90% accuracy in Science subjects',
          requirement: { type: 'accuracy', value: 90, subjectId: 'science' },
          reward: { id: 'r2', type: 'xp', value: 400, name: '400 XP' },
          progress: 65,
          isCompleted: false,
        },
        {
          id: 'nsmq_q3',
          name: 'Battle Victor',
          description: 'Win 15 quiz battles',
          requirement: { type: 'battles_won', value: 15 },
          reward: { id: 'r3', type: 'badge', value: 'battle_master', name: 'Battle Master Badge', rarity: 'epic' },
          progress: 40,
          isCompleted: false,
        },
        {
          id: 'nsmq_q4',
          name: 'Well Rounded',
          description: 'Practice Math, Physics, Chemistry, and Biology',
          requirement: { type: 'subjects_practiced', value: 4 },
          reward: { id: 'r4', type: 'xp', value: 300, name: '300 XP' },
          progress: 75,
          isCompleted: false,
        },
      ],
      userProgress: {
        questsCompleted: 0,
        totalQuests: 4,
        xpEarned: 1500,
        rewardsClaimed: [],
      },
    },
  };

  // House Cup event (shared across all exam types)
  const houseCupEvent: SeasonalEvent = {
    id: 'house_cup_january',
    name: 'House Cup: January Finals',
    description: 'Compete for your house to win exclusive rewards and glory!',
    theme: 'house_cup',
    startDate: now.toISOString(),
    endDate: weekFromNow.toISOString(),
    xpMultiplier: 1.5,
    accentColor: '#8B5CF6',
    isActive: true,
    rewards: [
      { id: 'house_trophy', type: 'cosmetic', value: 'house_trophy', name: 'House Trophy Avatar Frame', rarity: 'legendary' },
      { id: 'house_xp', type: 'xp', value: 2000, name: '2000 Bonus XP' },
    ],
    quests: [
      {
        id: 'house_q1',
        name: 'House Representative',
        description: 'Win 10 battles for your house',
        requirement: { type: 'battles_won', value: 10 },
        reward: { id: 'hr1', type: 'xp', value: 500, name: '500 House XP' },
        progress: 30,
        isCompleted: false,
      },
      {
        id: 'house_q2',
        name: 'Knowledge Contributor',
        description: 'Answer 50 questions correctly',
        requirement: { type: 'questions_answered', value: 50 },
        reward: { id: 'hr2', type: 'xp', value: 250, name: '250 House XP' },
        progress: 80,
        isCompleted: false,
      },
    ],
    userProgress: {
      questsCompleted: 0,
      totalQuests: 2,
      xpEarned: 750,
      rewardsClaimed: [],
    },
  };

  return [examEvents[examType], houseCupEvent];
}

function generateMockTournaments(): Tournament[] {
  const now = new Date();
  const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return [
    {
      id: 'math_championship',
      name: 'Mathematics Championship',
      description: 'Compete against the best in this weekly mathematics tournament!',
      type: 'leaderboard',
      status: 'active',
      startDate: now.toISOString(),
      endDate: weekFromNow.toISOString(),
      registrationEndDate: dayFromNow.toISOString(),
      maxParticipants: 500,
      currentParticipants: 234,
      userRegistered: true,
      userPosition: 45,
      subjectId: 'mathematics',
      subjectName: 'Mathematics',
      prizes: [
        { rank: 1, rewards: [{ id: 'p1', type: 'xp', value: 5000, name: '5000 XP' }, { id: 'p1b', type: 'badge', value: 'math_champion', name: 'Math Champion', rarity: 'legendary' }] },
        { rank: 2, rewards: [{ id: 'p2', type: 'xp', value: 3000, name: '3000 XP' }, { id: 'p2b', type: 'badge', value: 'math_master', name: 'Math Master', rarity: 'epic' }] },
        { rank: 3, rewards: [{ id: 'p3', type: 'xp', value: 2000, name: '2000 XP' }] },
        { rank: '4-10', rewards: [{ id: 'p4', type: 'xp', value: 1000, name: '1000 XP' }] },
      ],
      leaderboard: [
        { id: 'u1', name: 'Kwame Asante', wins: 15, losses: 2 },
        { id: 'u2', name: 'Ama Mensah', wins: 14, losses: 3 },
        { id: 'u3', name: 'Kofi Owusu', wins: 12, losses: 4 },
        { id: 'u4', name: 'Efua Darko', wins: 11, losses: 5 },
        { id: 'u5', name: 'Yaw Adjei', wins: 10, losses: 6 },
      ],
    },
    {
      id: 'science_bracket',
      name: 'Science Battle Royale',
      description: 'Single elimination tournament - only the best will survive!',
      type: 'bracket',
      status: 'registration',
      startDate: dayFromNow.toISOString(),
      endDate: weekFromNow.toISOString(),
      registrationEndDate: dayFromNow.toISOString(),
      maxParticipants: 64,
      currentParticipants: 48,
      userRegistered: false,
      subjectId: 'science',
      subjectName: 'Science',
      prizes: [
        { rank: 1, rewards: [{ id: 'sp1', type: 'xp', value: 10000, name: '10000 XP' }, { id: 'sp1b', type: 'title', value: 'Science Legend', name: 'Science Legend Title', rarity: 'legendary' }] },
        { rank: 2, rewards: [{ id: 'sp2', type: 'xp', value: 5000, name: '5000 XP' }] },
        { rank: 3, rewards: [{ id: 'sp3', type: 'xp', value: 2500, name: '2500 XP' }] },
      ],
    },
  ];
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      activeEvents: [],
      upcomingEvents: [],
      activeTournament: null,
      availableTournaments: [],
      userEventProgress: {},
      isLoading: false,
      error: null,

      fetchActiveEvents: async () => {
        set({ isLoading: true, error: null });

        // Get current exam type
        const examStore = useExamStore.getState();
        const currentExamType = examStore.currentExamType;

        try {
          const response = await api.get<{ events: SeasonalEvent[] }>('/events/active');

          if (response.success && response.data && response.data.events.length > 0) {
            const now = new Date();
            // Filter API events to only show relevant ones for current exam type
            const examThemeMap: Record<string, string[]> = {
              bece: ['bece_prep', 'house_cup', 'subject_week', 'holiday', 'special'],
              wassce: ['wassce_prep', 'house_cup', 'subject_week', 'holiday', 'special'],
              nsmq: ['nsmq_prep', 'house_cup', 'subject_week', 'holiday', 'special'],
            };
            const allowedThemes = examThemeMap[currentExamType] || examThemeMap.wassce;
            const filteredEvents = response.data.events.filter(
              e => allowedThemes.includes(e.theme) && new Date(e.endDate) > now
            );

            // If no relevant events from API, use mock data
            if (filteredEvents.length === 0) {
              const mockEvents = generateMockEvents(currentExamType);
              set({
                activeEvents: mockEvents.filter(e => e.isActive),
                upcomingEvents: [],
                isLoading: false,
              });
            } else {
              set({
                activeEvents: filteredEvents,
                upcomingEvents: response.data.events.filter(e => new Date(e.startDate) > now),
                isLoading: false,
              });
            }
          } else {
            // Use mock data with current exam type
            const mockEvents = generateMockEvents(currentExamType);
            set({
              activeEvents: mockEvents.filter(e => e.isActive),
              upcomingEvents: [],
              isLoading: false,
            });
          }
        } catch (error) {
          // Use mock data on error with current exam type
          const mockEvents = generateMockEvents(currentExamType);
          set({
            activeEvents: mockEvents.filter(e => e.isActive),
            upcomingEvents: [],
            isLoading: false,
          });
        }
      },

      fetchTournaments: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.get<{ tournaments: Tournament[] }>('/tournaments');

          if (response.success && response.data) {
            const tournaments = response.data.tournaments;
            const active = tournaments.find(t => t.status === 'active' && t.userRegistered);
            set({
              availableTournaments: tournaments,
              activeTournament: active || null,
              isLoading: false,
            });
          } else {
            // Use mock data
            const mockTournaments = generateMockTournaments();
            const active = mockTournaments.find(t => t.status === 'active' && t.userRegistered);
            set({
              availableTournaments: mockTournaments,
              activeTournament: active || null,
              isLoading: false,
            });
          }
        } catch (error) {
          // Use mock data on error
          const mockTournaments = generateMockTournaments();
          const active = mockTournaments.find(t => t.status === 'active' && t.userRegistered);
          set({
            availableTournaments: mockTournaments,
            activeTournament: active || null,
            isLoading: false,
          });
        }
      },

      joinTournament: async (tournamentId: string) => {
        try {
          const response = await api.post(`/tournaments/${tournamentId}/join`);

          if (response.success) {
            set((state) => ({
              availableTournaments: state.availableTournaments.map(t =>
                t.id === tournamentId
                  ? { ...t, userRegistered: true, currentParticipants: t.currentParticipants + 1 }
                  : t
              ),
            }));
            return true;
          }

          // Mock success for demo
          set((state) => ({
            availableTournaments: state.availableTournaments.map(t =>
              t.id === tournamentId
                ? { ...t, userRegistered: true, currentParticipants: t.currentParticipants + 1 }
                : t
            ),
          }));
          return true;
        } catch (error) {
          // Mock success for demo
          set((state) => ({
            availableTournaments: state.availableTournaments.map(t =>
              t.id === tournamentId
                ? { ...t, userRegistered: true, currentParticipants: t.currentParticipants + 1 }
                : t
            ),
          }));
          return true;
        }
      },

      claimEventReward: async (eventId: string, rewardId: string) => {
        try {
          const response = await api.post(`/events/${eventId}/claim/${rewardId}`);

          if (response.success) {
            set((state) => ({
              activeEvents: state.activeEvents.map(e =>
                e.id === eventId && e.userProgress
                  ? {
                      ...e,
                      userProgress: {
                        ...e.userProgress,
                        rewardsClaimed: [...e.userProgress.rewardsClaimed, rewardId],
                      },
                    }
                  : e
              ),
            }));
            return true;
          }
          return false;
        } catch (error) {
          console.error('Failed to claim reward:', error);
          return false;
        }
      },

      updateQuestProgress: (eventId: string, questId: string, progress: number) => {
        set((state) => ({
          activeEvents: state.activeEvents.map(event =>
            event.id === eventId
              ? {
                  ...event,
                  quests: event.quests.map(quest =>
                    quest.id === questId
                      ? {
                          ...quest,
                          progress: Math.min(100, progress),
                          isCompleted: progress >= 100,
                        }
                      : quest
                  ),
                }
              : event
          ),
        }));
      },

      clearError: () => set({ error: null }),

      getTimeRemaining: (endDate: string) => {
        const end = new Date(endDate).getTime();
        const now = Date.now();
        const diff = Math.max(0, end - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return { days, hours, minutes };
      },

      getCurrentXPMultiplier: () => {
        const { activeEvents } = get();
        const now = new Date();

        // Get the highest multiplier from active events
        const maxMultiplier = activeEvents
          .filter(e => new Date(e.startDate) <= now && new Date(e.endDate) >= now)
          .reduce((max, e) => Math.max(max, e.xpMultiplier), 1);

        return maxMultiplier;
      },
    }),
    {
      name: 'brilla-events',
      version: 1,
      partialize: (state) => ({
        userEventProgress: state.userEventProgress,
      }),
    }
  )
);
