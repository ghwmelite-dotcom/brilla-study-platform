// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const setExamType = vi.fn();
let examState: { currentExamType: string; isLoading: boolean };
let preferencesState: { preferences: unknown[]; primaryExamTypeId: string | null };
let authUser: { primaryExamTypeId?: string } | null;

vi.mock('@/stores/examStore', () => ({
  useExamStore: () => ({
    currentExamType: examState.currentExamType,
    isLoading: examState.isLoading,
    setExamType,
  }),
}));
vi.mock('@/stores/examPreferencesStore', () => ({
  useExamPreferencesStore: () => ({
    preferences: preferencesState.preferences,
    primaryExamTypeId: preferencesState.primaryExamTypeId,
    setActiveExamType: vi.fn(),
  }),
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { user: typeof authUser }) => unknown) =>
    selector({ user: authUser }),
}));

import { ExamModeSwitcher } from './ExamModeSwitcher';

const mounted: Array<{ container: HTMLDivElement; root: ReturnType<typeof createRoot> }> = [];

async function render() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<ExamModeSwitcher />);
  });
  mounted.push({ container, root });
  return container;
}

beforeEach(() => {
  setExamType.mockClear();
  examState = { currentExamType: 'nsmq', isLoading: false };
  preferencesState = { preferences: [], primaryExamTypeId: null };
  authUser = null;
});

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => {
      entry.root.unmount();
    });
    entry.container.remove();
  }
});

describe('ExamModeSwitcher primary exam type initialization', () => {
  it('falls back to the auth profile primary exam type when no preference rows exist', async () => {
    authUser = { primaryExamTypeId: 'exam_wassce' };
    await render();
    expect(setExamType).toHaveBeenCalledWith('wassce');
  });

  it('prefers the preferences-store primary over the auth profile', async () => {
    preferencesState = {
      preferences: [{ examTypeId: 'exam_bece', isPrimary: 1 }],
      primaryExamTypeId: 'exam_bece',
    };
    authUser = { primaryExamTypeId: 'exam_wassce' };
    await render();
    expect(setExamType).toHaveBeenCalledWith('bece');
  });

  it('does nothing when neither source has a primary exam type', async () => {
    await render();
    expect(setExamType).not.toHaveBeenCalled();
  });

  it('does not re-switch when the current exam type already matches the primary', async () => {
    examState.currentExamType = 'wassce';
    authUser = { primaryExamTypeId: 'exam_wassce' };
    await render();
    expect(setExamType).not.toHaveBeenCalled();
  });
});
