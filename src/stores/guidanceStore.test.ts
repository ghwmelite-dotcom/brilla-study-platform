import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { api } from '@/lib/api';
import { useGuidanceStore } from './guidanceStore';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('guidanceStore assessment state machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGuidanceStore.getState().resetQuiz();
    useGuidanceStore.setState({ goals: [], wizardOpen: false, isLoading: false, error: null });
  });

  it('handles a terminal start response when the objective question bank is empty', async () => {
    (api.post as Mock).mockResolvedValue({
      success: true,
      data: {
        sessionId: 'guidance_1',
        version: 2,
        askedSoFar: 0,
        target: 9,
        evidenceCount: 0,
        topicCoverage: { covered: 0, total: 0, ratio: 0 },
        freshness: null,
        confidence: 'low',
        algorithmVersion: 'brie-readiness-v1',
        completedEarly: true,
        done: {
          readiness: 0,
          evidenceCount: 0,
          topicCoverage: { covered: 0, total: 0, ratio: 0 },
          freshness: null,
          confidence: 'low',
          algorithmVersion: 'brie-readiness-v1',
          completedEarly: true,
        },
      },
    });
    (api.get as Mock).mockResolvedValue({ success: false, error: 'Plan unavailable in this unit test' });

    const result = await useGuidanceStore.getState().startAssessment('wassce', 'subject_1');

    expect(result).toBe('complete');
    expect(useGuidanceStore.getState()).toMatchObject({
      currentQuestion: null,
      readiness: 0,
      askedSoFar: 0,
      sessionVersion: 2,
      skipped: false,
    });
  });
});
