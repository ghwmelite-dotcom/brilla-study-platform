// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { mapApiSubject, useExamStore } from './examStore';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const apiSubject = {
  id: 'subj_wassce_core_math',
  name: 'Core Mathematics',
  slug: 'core-mathematics',
  icon: 'Calculator',
  color: '#3B82F6',
  exam_type_id: 'exam_wassce',
  category_id: 'cat_wassce_core',
  is_active: 1,
  display_order: '1',
  topicCount: '6',
  questionCount: '20',
  availabilityStatus: 'available',
  availabilityReason: 'question_bank_meets_operational_floor',
  contentReviewStatus: 'legacy_unreviewed',
};

describe('examStore live subject catalogue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExamStore.setState({
      currentExamType: 'wassce',
      subjects: [],
      categories: [],
      paperTypes: [],
      isLoadingSubjects: false,
      error: null,
    });
  });

  it('maps the API DTO explicitly instead of trusting a type assertion', () => {
    expect(mapApiSubject(apiSubject)).toMatchObject({
      id: 'subj_wassce_core_math',
      examTypeId: 'exam_wassce',
      categoryId: 'cat_wassce_core',
      isActive: true,
      displayOrder: 1,
      topicCount: 6,
      questionCount: 20,
      availabilityStatus: 'available',
      contentReviewStatus: 'legacy_unreviewed',
    });
  });

  it('uses live counts and availability from the requested exam', async () => {
    vi.mocked(api.get).mockResolvedValue({ success: true, data: [apiSubject] });

    await useExamStore.getState().fetchSubjects('wassce');

    expect(api.get).toHaveBeenCalledWith('/subjects?exam_type=wassce');
    expect(useExamStore.getState().subjects).toHaveLength(1);
    expect(useExamStore.getState().subjects[0].questionCount).toBe(20);
    expect(useExamStore.getState().error).toBeNull();
  });

  it('ignores an obsolete response after a rapid exam switch', async () => {
    const first = deferred<{ success: true; data: typeof apiSubject[] }>();
    const second = deferred<{ success: true; data: typeof apiSubject[] }>();
    vi.mocked(api.get)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const firstRequest = useExamStore.getState().fetchSubjects('wassce');
    useExamStore.setState({ currentExamType: 'igcse' });
    const secondRequest = useExamStore.getState().fetchSubjects('igcse');

    second.resolve({
      success: true,
      data: [{ ...apiSubject, id: 'igcse-math', exam_type_id: 'igcse' }],
    });
    await secondRequest;
    first.resolve({ success: true, data: [apiSubject] });
    await firstRequest;

    expect(useExamStore.getState().subjects[0].id).toBe('igcse-math');
  });

  it('shows a retryable error without rendering fabricated coverage counts', async () => {
    vi.mocked(api.get).mockResolvedValue({ success: false, error: 'Network unavailable' });

    await useExamStore.getState().fetchSubjects('wassce');

    const state = useExamStore.getState();
    expect(state.error).toBe('Network unavailable');
    expect(state.subjects.length).toBeGreaterThan(0);
    expect(state.subjects.every((subject) => (
      subject.availabilityStatus === 'unknown'
      && subject.questionCount === undefined
      && subject.topicCount === undefined
    ))).toBe(true);
  });

  it('clears loading and exposes a retryable error when the request rejects', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Connection interrupted'));

    await useExamStore.getState().fetchSubjects('wassce');

    const state = useExamStore.getState();
    expect(state.isLoadingSubjects).toBe(false);
    expect(state.error).toBe('Connection interrupted');
    expect(state.subjects.every((subject) => subject.availabilityStatus === 'unknown')).toBe(true);
  });
});