// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRevisionClassroomStore, type WhiteboardStep } from './revisionClassroomStore';
import { api } from '@/lib/api';

// Store-level tests for the progressive whiteboard step-fetch failure path:
// a failed fetchNextWhiteboardStep must (1) surface whiteboardStepError so
// the component can offer a Retry button, and (2) schedule exactly ONE
// bounded automatic retry (~3s) that is discarded when superseded.

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockPost = vi.mocked(api.post);

const OUTLINE = ['Introduction', 'Core concepts', 'Worked example', 'Practice tips', 'Summary'];

const step0: WhiteboardStep = {
  stepNumber: 1,
  explanation: 'Step 1',
  duration: 5,
  commands: [{ type: 'text', id: 's0-a', props: { text: 'hi' } }],
};

const step1: WhiteboardStep = {
  stepNumber: 2,
  explanation: 'Step 2',
  duration: 5,
  commands: [{ type: 'text', id: 's1-a', props: { text: 'there' } }],
};

function seedWhiteboardState() {
  useRevisionClassroomStore.setState(state => ({
    ...state,
    currentLesson: { id: 'lesson_1' } as never,
    currentSession: { id: 'session_1' } as never,
    whiteboardOutline: OUTLINE,
    whiteboardSteps: [step0],
    whiteboardTotalSteps: OUTLINE.length,
    whiteboardLessonType: 'step-by-step',
    whiteboardStepLoading: false,
    whiteboardStepError: null,
    error: null,
  }));
  useRevisionClassroomStore.getState().whiteboardStepsInFlight.clear();
  useRevisionClassroomStore.getState().whiteboardStepsAutoRetried.clear();
}

describe('fetchNextWhiteboardStep failure recovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    seedWhiteboardState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets whiteboardStepError on failure and auto-retries exactly once after ~3s', async () => {
    mockPost.mockRejectedValue(new Error('network down'));

    await useRevisionClassroomStore.getState().fetchNextWhiteboardStep(1);

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(useRevisionClassroomStore.getState().whiteboardStepError).toBe('network down');
    expect(useRevisionClassroomStore.getState().whiteboardStepLoading).toBe(false);

    // No retry before the delay elapses.
    await vi.advanceTimersByTimeAsync(2999);
    expect(mockPost).toHaveBeenCalledTimes(1);

    // The one automatic retry fires...
    await vi.advanceTimersByTimeAsync(1);
    expect(mockPost).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(0);
    expect(useRevisionClassroomStore.getState().whiteboardStepError).toBe('network down');

    // ...and no further retries are scheduled after it also fails.
    await vi.advanceTimersByTimeAsync(60000);
    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  it('a successful auto-retry appends the step and clears whiteboardStepError', async () => {
    mockPost
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        success: true,
        data: { step: step1, stepIndex: 1, totalSteps: OUTLINE.length, fallback: false, cached: false },
      } as never);

    await useRevisionClassroomStore.getState().fetchNextWhiteboardStep(1);
    expect(useRevisionClassroomStore.getState().whiteboardStepError).toBe('network down');

    await vi.advanceTimersByTimeAsync(3000);
    // Flush the retry's promise chain.
    await vi.advanceTimersByTimeAsync(0);

    const s = useRevisionClassroomStore.getState();
    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(s.whiteboardSteps[1]).toEqual(step1);
    expect(s.whiteboardStepError).toBeNull();
    expect(s.whiteboardStepLoading).toBe(false);
  });

  it('skips the auto-retry when the step arrived by other means before the delay', async () => {
    mockPost.mockRejectedValue(new Error('network down'));

    await useRevisionClassroomStore.getState().fetchNextWhiteboardStep(1);
    expect(mockPost).toHaveBeenCalledTimes(1);

    // Step arrives through another path (e.g. manual fetch that succeeded).
    useRevisionClassroomStore.setState(state => ({
      ...state,
      whiteboardSteps: [step0, step1],
    }));

    await vi.advanceTimersByTimeAsync(60000);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('skips the auto-retry when the whiteboard was restarted (new outline)', async () => {
    mockPost.mockRejectedValue(new Error('network down'));

    await useRevisionClassroomStore.getState().fetchNextWhiteboardStep(1);
    expect(mockPost).toHaveBeenCalledTimes(1);

    // User started a different whiteboard lesson before the retry fired.
    useRevisionClassroomStore.setState(state => ({
      ...state,
      whiteboardOutline: ['New', 'Outline', 'Here', 'Now'],
      whiteboardSteps: [step0],
    }));

    await vi.advanceTimersByTimeAsync(60000);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('a manual retry after failure is not blocked by the dedupe set', async () => {
    mockPost
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        success: true,
        data: { step: step1, stepIndex: 1, totalSteps: OUTLINE.length, fallback: false, cached: false },
      } as never);

    await useRevisionClassroomStore.getState().fetchNextWhiteboardStep(1);
    expect(useRevisionClassroomStore.getState().whiteboardStepError).toBe('network down');

    // Component Retry button re-invokes onNeedStep(currentStep).
    await useRevisionClassroomStore.getState().fetchNextWhiteboardStep(1);

    const s = useRevisionClassroomStore.getState();
    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(s.whiteboardSteps[1]).toEqual(step1);
    expect(s.whiteboardStepError).toBeNull();
  });

  it('still dedupes concurrent in-flight fetches for the same index', async () => {
    let resolveFetch: (v: unknown) => void = () => {};
    mockPost.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = resolve as (v: unknown) => void;
        })
    );

    const first = useRevisionClassroomStore.getState().fetchNextWhiteboardStep(1);
    const second = useRevisionClassroomStore.getState().fetchNextWhiteboardStep(1);
    await second; // returns immediately — index already in flight
    expect(mockPost).toHaveBeenCalledTimes(1);

    resolveFetch({
      success: true,
      data: { step: step1, stepIndex: 1, totalSteps: OUTLINE.length },
    });
    await first;
    expect(useRevisionClassroomStore.getState().whiteboardSteps[1]).toEqual(step1);
  });
});
