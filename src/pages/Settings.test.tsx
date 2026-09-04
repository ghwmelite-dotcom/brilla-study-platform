// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  updateProfile: vi.fn(),
  setPreferences: vi.fn(),
  setActiveExamType: vi.fn(),
  applyProfileExamType: vi.fn(),
}));

let preferencesState: {
  preferences: Array<{ id: string; examTypeId: string; isPrimary: boolean }>;
  primaryExamTypeId: string | null;
  isLoading: boolean;
};

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user_1',
      email: 'student@test.dev',
      name: 'Test Student',
      role: 'student',
      status: 'approved',
      schoolLevel: 'shs',
      xpPoints: 0,
      level: 1,
      primaryExamTypeId: 'exam_wassce',
    },
    updateProfile: mocks.updateProfile,
    getLinkedProviders: vi.fn(),
    unlinkGoogle: vi.fn(),
    initiateGoogleAuth: vi.fn(),
  }),
}));

vi.mock('@/stores/examPreferencesStore', () => {
  const hook = () => ({
    preferences: preferencesState.preferences,
    primaryExamTypeId: preferencesState.primaryExamTypeId,
    isLoading: preferencesState.isLoading,
    setPreferences: mocks.setPreferences,
    setActiveExamType: mocks.setActiveExamType,
  });
  hook.getState = () => ({
    preferences: preferencesState.preferences,
    primaryExamTypeId: preferencesState.primaryExamTypeId,
  });
  return { useExamPreferencesStore: hook };
});

vi.mock('@/stores/examStore', () => ({
  useExamStore: {
    getState: () => ({
      applyProfileExamType: mocks.applyProfileExamType,
    }),
  },
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  fetchWithAuth: vi.fn(),
}));

vi.mock('@/components/common/Turnstile', () => ({
  Turnstile: () => <div data-testid="turnstile" />,
}));

vi.mock('@/hooks/useTurnstile', () => ({
  useTurnstile: () => ({
    isVerified: false,
    token: null,
    handleVerify: vi.fn(),
    handleError: vi.fn(),
    handleExpire: vi.fn(),
    reset: vi.fn(),
  }),
}));

import Settings from './Settings';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('Settings exam mode tab', () => {
  let container: HTMLDivElement;
  let root: Root;

  async function render() {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(<Settings />);
    });
    return container;
  }

  async function click(element: Element | null | undefined) {
    await act(async () => {
      element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    preferencesState = {
      preferences: [
        { id: 'pref_1', examTypeId: 'exam_wassce', isPrimary: true },
        { id: 'pref_2', examTypeId: 'exam_nsmq', isPrimary: false },
      ],
      primaryExamTypeId: 'exam_wassce',
      isLoading: false,
    };
    mocks.setPreferences.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('saves a new primary exam and releases the sticky manual exam-mode choice', async () => {
    const rendered = await render();

    const examsTab = [...rendered.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Exam Mode'),
    );
    expect(examsTab).toBeTruthy();
    await click(examsTab);

    // Both saved exams render; star the NSMQ card to make it primary.
    const star = rendered.querySelector('button[title="Set as primary"]');
    expect(star).toBeTruthy();
    await click(star);

    const saveButton = [...rendered.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Save Exam Preferences'),
    );
    expect(saveButton).toBeTruthy();
    expect((saveButton as HTMLButtonElement).disabled).toBe(false);
    await click(saveButton);

    expect(mocks.setPreferences).toHaveBeenCalledWith(
      ['exam_wassce', 'exam_nsmq'],
      'exam_nsmq',
    );
    expect(mocks.applyProfileExamType).toHaveBeenCalledWith('nsmq');
    expect(mocks.setActiveExamType).toHaveBeenCalledWith('exam_nsmq');
    expect(mocks.updateProfile).toHaveBeenCalledWith({ primaryExamTypeId: 'exam_nsmq' });
  });

  it('keeps the save button disabled until the user changes something', async () => {
    const rendered = await render();
    const examsTab = [...rendered.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Exam Mode'),
    );
    await click(examsTab);

    const saveButton = [...rendered.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Save Exam Preferences'),
    ) as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);
  });
});
