import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { useRewardStore, type LuckyWheelState } from './rewardStore';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const wheel: LuckyWheelState = {
  available: true,
  spinsRemaining: 2,
  segments: [],
};

describe('reward store server-authoritative wheel and disabled surprise challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRewardStore.setState({
      luckyWheel: null,
      activeChallenge: null,
      recentRewards: [],
      isLoading: false,
      error: null,
    });
  });

  it('loads the real wheel status route and maps the remaining spins', async () => {
    vi.mocked(api.get).mockResolvedValue({
      success: true,
      data: {
        canSpin: true,
        weeklySpins: 1,
        maxWeeklySpins: 3,
        segments: [
          { id: 1, type: 'xp', label: '50 XP' },
          { id: 4, type: 'multiplier', label: '1.5x Multiplier' },
        ],
      },
    });

    await useRewardStore.getState().fetchLuckyWheel();

    expect(api.get).toHaveBeenCalledWith('/rewards/wheel/status');
    expect(useRewardStore.getState().luckyWheel).toMatchObject({
      available: true,
      spinsRemaining: 2,
      segments: [
        { id: 'w1', type: 'xp', label: '50 XP' },
        { id: 'w4', type: 'bonus_time', label: '1.5x Multiplier' },
      ],
    });
  });

  it('does not fabricate wheel availability when status loading fails', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('network down'));

    await useRewardStore.getState().fetchLuckyWheel();

    expect(useRewardStore.getState()).toMatchObject({
      luckyWheel: null,
      error: 'Unable to load wheel status',
      isLoading: false,
    });
  });

  it('maps a server-awarded spin and trusts its remaining-spin count', async () => {
    useRewardStore.setState({ luckyWheel: wheel });
    vi.mocked(api.post).mockResolvedValue({
      success: true,
      data: { segment: 1, type: 'xp', value: 50, label: '50 XP', spinsRemaining: 1 },
    });

    const reward = await useRewardStore.getState().spinLuckyWheel();

    expect(api.post).toHaveBeenCalledWith('/rewards/wheel/spin');
    expect(reward).toMatchObject({ type: 'xp', amount: 50, message: 'You won 50 XP!', wheelSegmentId: 1 });
    expect(useRewardStore.getState().luckyWheel).toMatchObject({
      available: true,
      spinsRemaining: 1,
    });
  });

  it('returns no reward when the server spin fails', async () => {
    useRewardStore.setState({ luckyWheel: wheel });
    vi.mocked(api.post).mockRejectedValue(new Error('network down'));

    await expect(useRewardStore.getState().spinLuckyWheel()).resolves.toBeNull();
    expect(useRewardStore.getState().recentRewards).toEqual([]);
    expect(useRewardStore.getState().error).toBe('Unable to spin wheel');
  });

  it('does not call missing surprise endpoints or fabricate challenge rewards', async () => {
    useRewardStore.setState({
      activeChallenge: {
        id: 'legacy',
        title: 'Legacy',
        description: 'Legacy client challenge',
        xpMultiplier: 2,
        timeLimit: 60,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        requirement: { type: 'quiz', target: 1 },
      },
    });

    await useRewardStore.getState().checkForSurpriseChallenge();
    await expect(useRewardStore.getState().completeSurpriseChallenge()).resolves.toBeNull();

    expect(api.get).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
    expect(useRewardStore.getState().activeChallenge).toBeNull();
    expect(useRewardStore.getState().recentRewards).toEqual([]);
  });
});
