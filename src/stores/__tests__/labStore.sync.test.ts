// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { useLabStore } from '../labStore';
import { getExperimentBySlug } from '@/data/experiments';
import type { GradingResult } from '@/types';

vi.mock('@/lib/api', () => ({
  api: {
    startLabSession: vi.fn(),
    appendLabEvents: vi.fn(),
    submitLabSession: vi.fn(),
  },
}));

const titration = getExperimentBySlug('acid-base-titration')!;
const phet = getExperimentBySlug('ohms-law')!;

const okStart = {
  success: true,
  data: { sessionId: 'srv_1', graded: 1 as const, experimentSlug: titration.slug, mode: 'guided' as const },
};

const startLabSession = vi.mocked(api.startLabSession);
const appendLabEvents = vi.mocked(api.appendLabEvents);
const submitLabSession = vi.mocked(api.submitLabSession);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useLabStore.getState().reset();
  startLabSession.mockResolvedValue(okStart);
  // Echo the batch size: the store drops exactly the events the server
  // acknowledged (accepted + duplicates).
  appendLabEvents.mockImplementation((_id, events) =>
    Promise.resolve({ success: true, data: { accepted: events.length, duplicates: 0 } }),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe('labStore server sync', () => {
  it('startSession creates a server session and keeps the returned id', async () => {
    await useLabStore.getState().startSession(titration, 'guided');
    expect(api.startLabSession).toHaveBeenCalledWith('acid-base-titration', 'guided');
    expect(useLabStore.getState().serverSessionId).toBe('srv_1');
  });

  it('queued events carry stable clientEventIds and persist via the store snapshot', async () => {
    await useLabStore.getState().startSession(titration, 'guided');
    useLabStore.getState().recordMeasurement(25.1, 'ml', 'Titre value 1', 'Average titre value');
    const queue = useLabStore.getState().eventQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ eventType: 'measurement' });
    expect(typeof queue[0].clientEventId).toBe('string');

    // The queue must be in the persisted (partialized) snapshot.
    const persisted = JSON.parse(localStorage.getItem('brilla-lab')!);
    expect(persisted.state.eventQueue).toHaveLength(1);
  });

  it('auto-flushes at 20 queued events', async () => {
    await useLabStore.getState().startSession(titration, 'guided');
    for (let i = 0; i < 20; i++) {
      useLabStore.getState().recordObservation(`note ${i}`);
    }
    await vi.waitFor(() => expect(api.appendLabEvents).toHaveBeenCalled());
    const [, events] = appendLabEvents.mock.calls[0];
    expect(events).toHaveLength(20);
    expect(useLabStore.getState().eventQueue).toHaveLength(0);
  });

  it('a failed flush retains the queue and retries without duplicating clientEventIds', async () => {
    vi.useFakeTimers();
    appendLabEvents.mockRejectedValueOnce(new Error('offline'));
    await useLabStore.getState().startSession(titration, 'guided');
    useLabStore.getState().recordObservation('bubbles');
    await useLabStore.getState().flushEventQueue();
    expect(useLabStore.getState().eventQueue).toHaveLength(1); // retained

    const firstIds = useLabStore.getState().eventQueue.map((e) => e.clientEventId);
    await useLabStore.getState().flushEventQueue(); // retry succeeds
    const sentIds = appendLabEvents.mock.calls[1][1].map((e) => e.clientEventId);
    expect(sentIds).toEqual(firstIds); // same ids — server dedupes via INSERT OR IGNORE
    expect(useLabStore.getState().eventQueue).toHaveLength(0);
  });

  it('submitExperiment flushes, posts submit, and stores the server grading breakdown', async () => {
    const grading: GradingResult = {
      totalScore: 12, maxScore: 20, percentageScore: 60,
      criteriaScores: [{ criterionId: 'c', criterionName: 'Technique', score: 12, maxScore: 20, feedback: 'Good technique with minor issues' }],
      stepScores: [{ stepNumber: 1, marksEarned: 2, maxMarks: 2, evidence: 'full', feedback: 'All required actions observed' }],
    };
    submitLabSession.mockResolvedValue({ success: true, data: { graded: true, grading } });
    await useLabStore.getState().startSession(titration, 'guided');
    const result = await useLabStore.getState().submitExperiment();
    expect(result).toEqual(grading);
    expect(useLabStore.getState().lastAttemptResult).toEqual(grading);
  });

  it('submitExperiment failure sets an honest pending state — no fabricated score', async () => {
    submitLabSession.mockResolvedValue({ success: false, error: 'Network error.' });
    await useLabStore.getState().startSession(titration, 'guided');
    await expect(useLabStore.getState().submitExperiment()).rejects.toThrow();
    expect(useLabStore.getState().lastAttemptResult).toBeNull();
    expect(useLabStore.getState().submitPending).toBe(true);
  });

  it('finishPractice marks PhET sessions submitted with no score', async () => {
    startLabSession.mockResolvedValue({ ...okStart, data: { ...okStart.data, graded: 0 as const } });
    submitLabSession.mockResolvedValue({ success: true, data: { graded: false, reason: 'practice' } });
    await useLabStore.getState().startSession(phet, 'guided');
    await useLabStore.getState().finishPractice();
    expect(api.submitLabSession).toHaveBeenCalledWith('srv_1');
    expect(useLabStore.getState().lastAttemptResult).toBeNull();
  });

  it('LAB_PREMIUM_REQUIRED surfaces as an error and rolls back the local session', async () => {
    startLabSession.mockResolvedValue({
      success: false, error: 'This experiment requires an active premium plan.', code: 'LAB_PREMIUM_REQUIRED',
    });
    await useLabStore.getState().startSession(titration, 'guided');
    expect(useLabStore.getState().error).toBe('LAB_PREMIUM_REQUIRED');
    expect(useLabStore.getState().currentSession).toBeNull();
  });
});
