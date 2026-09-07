// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTeamBattleStore, type TeamBattleData } from './teamBattleStore';
import { api } from '@/lib/api';

// Contract tests: the store must call the real /team-battles routes with the
// shapes workers/api/teambattles.ts implements, and must surface API errors
// honestly (the old store silently fell back to fabricated mock battles).

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockPost = vi.mocked(api.post);
const mockGet = vi.mocked(api.get);

const battleData: TeamBattleData = {
  battle: {
    id: 'tb_1',
    status: 'waiting',
    totalQuestions: 10,
    timePerQuestion: 30,
    team1Score: 0,
    team2Score: 0,
    winnerTeam: null,
    xpReward: 200,
    currentQuestion: 0,
    roundEndsAt: null,
    createdAt: '2026-09-06T00:00:00.000Z',
    question: null,
  },
  team1: [
    { userId: 'cap_1', name: 'Captain', isCaptain: true, teamNumber: 1, score: 0, correctAnswers: 0, answeredCount: 0 },
  ],
  team2: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  useTeamBattleStore.getState().reset();
  useTeamBattleStore.setState({ availableBattles: [], error: null, isLoading: false });
});

describe('teamBattleStore API contract', () => {
  it('createBattle posts to /team-battles/create with the option payload', async () => {
    mockPost.mockResolvedValueOnce({ success: true, data: { battleId: 'tb_1' } });
    mockGet.mockResolvedValueOnce({ success: true, data: battleData });

    const id = await useTeamBattleStore.getState().createBattle({ totalQuestions: 5, timePerQuestion: 45 });

    expect(id).toBe('tb_1');
    expect(mockPost).toHaveBeenCalledWith('/team-battles/create', { totalQuestions: 5, timePerQuestion: 45 });
    expect(mockGet).toHaveBeenCalledWith('/team-battles/tb_1');
    expect(useTeamBattleStore.getState().current).toEqual(battleData);
  });

  it('joinBattle posts { teamNumber } (never the old teamId field)', async () => {
    mockPost.mockResolvedValueOnce({ success: true, data: { joined: true, teamNumber: 2 } });
    mockGet.mockResolvedValueOnce({ success: true, data: battleData });

    await useTeamBattleStore.getState().joinBattle('tb_1', 2);

    expect(mockPost).toHaveBeenCalledWith('/team-battles/tb_1/join', { teamNumber: 2 });
  });

  it('joinByCode posts to /team-battles/join-by-code and returns the loaded battle', async () => {
    mockPost.mockResolvedValueOnce({ success: true, data: { battleId: 'tb_1', teamNumber: 2 } });
    mockGet.mockResolvedValueOnce({ success: true, data: battleData });

    const data = await useTeamBattleStore.getState().joinByCode('ABCD1234');

    expect(mockPost).toHaveBeenCalledWith('/team-battles/join-by-code', { code: 'ABCD1234' });
    expect(data).toEqual(battleData);
  });

  it('startBattle posts to /team-battles/:id/start (no /ready endpoint)', async () => {
    mockPost.mockResolvedValueOnce({ success: true, data: { started: true, teamSize: 2 } });
    mockGet.mockResolvedValueOnce({ success: true, data: { ...battleData, battle: { ...battleData.battle, status: 'active' as const } } });

    await useTeamBattleStore.getState().startBattle('tb_1');

    expect(mockPost).toHaveBeenCalledWith('/team-battles/tb_1/start');
  });

  it('leaveBattle posts to /team-battles/:id/leave and clears state', async () => {
    useTeamBattleStore.setState({ current: battleData });
    mockPost.mockResolvedValueOnce({ success: true, data: { left: true, deleted: false } });

    await useTeamBattleStore.getState().leaveBattle('tb_1');

    expect(mockPost).toHaveBeenCalledWith('/team-battles/tb_1/leave');
    expect(useTeamBattleStore.getState().current).toBeNull();
  });

  it('submitAnswer posts { questionId, answer } — never questionIndex', async () => {
    useTeamBattleStore.setState({ current: battleData });
    mockPost.mockResolvedValueOnce({
      success: true,
      data: { correct: true, points: 5, correctAnswer: 'A', questionIndex: 0, timeTaken: 2 },
    });

    const result = await useTeamBattleStore.getState().submitAnswer('q1', 'A');

    expect(mockPost).toHaveBeenCalledWith('/team-battles/tb_1/answer', { questionId: 'q1', answer: 'A' });
    expect(result.points).toBe(5);
  });

  it('submitAnswer surfaces server errors (round closed, duplicate) instead of fabricating results', async () => {
    useTeamBattleStore.setState({ current: battleData });
    mockPost.mockResolvedValueOnce({ success: false, error: 'That round is not open' });

    await expect(useTeamBattleStore.getState().submitAnswer('q1', 'A')).rejects.toThrow('That round is not open');
  });

  it('fetchAvailableBattles surfaces failures honestly — no fabricated battle list', async () => {
    mockGet.mockRejectedValueOnce(new Error('network down'));

    await useTeamBattleStore.getState().fetchAvailableBattles();

    const state = useTeamBattleStore.getState();
    expect(state.availableBattles).toEqual([]);
    expect(state.error).toBe('network down');
  });

  it('fetchBattle returns null and sets error on failure (no mock battle)', async () => {
    mockGet.mockResolvedValueOnce({ success: false, error: 'Battle not found' });

    const result = await useTeamBattleStore.getState().fetchBattle('tb_gone');

    expect(result).toBeNull();
    expect(useTeamBattleStore.getState().error).toBe('Battle not found');
    expect(useTeamBattleStore.getState().current).toBeNull();
  });
});
