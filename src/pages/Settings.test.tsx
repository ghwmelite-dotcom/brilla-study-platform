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
  apiGet: vi.fn(),
  apiPut: vi.fn(),
  apiPost: vi.fn(),
  apiDelete: vi.fn(),
  getLinkedProviders: vi.fn(),
  unlinkGoogle: vi.fn(),
  initiateGoogleAuth: vi.fn(),
}));

let preferencesState: {
  preferences: Array<{ id: string; examTypeId: string; isPrimary: boolean }>;
  primaryExamTypeId: string | null;
  isLoading: boolean;
};

let authUser: {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  schoolLevel?: string;
  xpPoints: number;
  level: number;
  primaryExamTypeId?: string;
} | null;

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: authUser,
    updateProfile: mocks.updateProfile,
    getLinkedProviders: mocks.getLinkedProviders,
    unlinkGoogle: mocks.unlinkGoogle,
    initiateGoogleAuth: mocks.initiateGoogleAuth,
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
    get: mocks.apiGet,
    put: mocks.apiPut,
    post: mocks.apiPost,
    delete: mocks.apiDelete,
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
    authUser = {
      id: 'user_1',
      email: 'student@test.dev',
      name: 'Test Student',
      role: 'student',
      status: 'approved',
      schoolLevel: 'shs',
      xpPoints: 0,
      level: 1,
      primaryExamTypeId: 'exam_wassce',
    };
    preferencesState = {
      preferences: [
        { id: 'pref_1', examTypeId: 'exam_wassce', isPrimary: true },
        { id: 'pref_2', examTypeId: 'exam_nsmq', isPrimary: false },
      ],
      primaryExamTypeId: 'exam_wassce',
      isLoading: false,
    };
    mocks.setPreferences.mockResolvedValue(undefined);
    mocks.apiGet.mockImplementation((url: string) => {
      if (url.includes('telegram')) {
        return Promise.resolve({ success: true, data: { linked: false, username: null, stale: false } });
      }
      if (url.includes('marketing')) {
        return Promise.resolve({
          success: true,
          data: { referralRewardsOptIn: false, emailVerified: true, providerSyncStatus: 'not_synced' },
        });
      }
      return Promise.resolve({ success: true, data: {} });
    });
    mocks.apiPut.mockResolvedValue({ success: true, data: {} });
    mocks.getLinkedProviders.mockResolvedValue({ providers: [], hasPassword: true });
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

  it('shows the save error and does not touch exam mode when the API update fails', async () => {
    mocks.setPreferences.mockRejectedValue(new Error('Network down'));
    const rendered = await render();
    const examsTab = [...rendered.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Exam Mode'),
    );
    await click(examsTab);

    const star = rendered.querySelector('button[title="Set as primary"]');
    await click(star);
    const saveButton = [...rendered.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Save Exam Preferences'),
    );
    await click(saveButton);

    expect(rendered.textContent).toContain('Network down');
    expect(mocks.applyProfileExamType).not.toHaveBeenCalled();
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it('shows a loading spinner instead of the selector while preferences load', async () => {
    preferencesState.isLoading = true;
    const rendered = await render();
    const examsTab = [...rendered.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Exam Mode'),
    );
    await click(examsTab);

    expect(rendered.querySelector('button[title="Set as primary"]')).toBeNull();
    expect(
      [...rendered.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Save Exam Preferences'),
      ),
    ).toBeTruthy();
  });

  it('hides the Exam Mode tab for admins, who have no exam preferences', async () => {
    authUser = { ...authUser!, role: 'admin' };
    const rendered = await render();
    expect(
      [...rendered.querySelectorAll('button')].find((b) =>
        b.textContent?.includes('Exam Mode'),
      ),
    ).toBeUndefined();
  });

  it('lets teachers pick from every exam type including international ones', async () => {
    authUser = { ...authUser!, role: 'teacher', schoolLevel: 'shs' };
    const rendered = await render();
    const examsTab = [...rendered.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Exam Mode'),
    );
    await click(examsTab);

    expect(rendered.textContent).toContain('Exam Types You Teach');
    expect(rendered.textContent).toContain('IGCSE');
    expect(rendered.textContent).toContain('A-Level');
  });

  it('maps JHS students to the BECE-only read-only card', async () => {
    authUser = { ...authUser!, schoolLevel: 'jhs' };
    preferencesState = {
      preferences: [{ id: 'pref_1', examTypeId: 'exam_bece', isPrimary: true }],
      primaryExamTypeId: 'exam_bece',
      isLoading: false,
    };
    const rendered = await render();
    const examsTab = [...rendered.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Exam Mode'),
    );
    await click(examsTab);

    expect(rendered.textContent).toContain(
      'JHS students prepare for the Basic Education Certificate Examination',
    );
  });
});

describe('Settings other tabs', () => {
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

  async function wait(ms: number) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
  }

  function findButton(scope: Element, text: string) {
    return [...scope.querySelectorAll('button')].find((b) => b.textContent?.includes(text));
  }

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authUser = {
      id: 'user_1',
      email: 'student@test.dev',
      name: 'Test Student',
      role: 'student',
      status: 'approved',
      schoolLevel: 'shs',
      xpPoints: 0,
      level: 1,
      primaryExamTypeId: 'exam_wassce',
    };
    preferencesState = {
      preferences: [{ id: 'pref_1', examTypeId: 'exam_wassce', isPrimary: true }],
      primaryExamTypeId: 'exam_wassce',
      isLoading: false,
    };
    mocks.setPreferences.mockResolvedValue(undefined);
    mocks.apiGet.mockImplementation((url: string) => {
      if (url.includes('telegram')) {
        return Promise.resolve({ success: true, data: { linked: false, username: null, stale: false } });
      }
      if (url.includes('marketing')) {
        return Promise.resolve({
          success: true,
          data: { referralRewardsOptIn: false, emailVerified: true, providerSyncStatus: 'not_synced' },
        });
      }
      return Promise.resolve({ success: true, data: {} });
    });
    mocks.apiPut.mockResolvedValue({ success: true, data: {} });
    mocks.getLinkedProviders.mockResolvedValue({ providers: [], hasPassword: true });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('saves profile changes through the API and updates the auth store', async () => {
    const rendered = await render();
    const saveButton = findButton(rendered, 'Save Changes');
    await click(saveButton);

    expect(mocks.apiPut).toHaveBeenCalledWith('/users/me', {
      name: 'Test Student',
      schoolName: '',
      house: '',
    });
    expect(mocks.updateProfile).toHaveBeenCalledWith({ name: 'Test Student', house: '' });
    expect(rendered.textContent).toContain('Profile updated successfully!');
  });

  it('persists appearance choices to localStorage and applies the theme', async () => {
    const rendered = await render();
    await click(findButton(rendered, 'Appearance'));
    await click(findButton(rendered, 'Dark'));
    await click(findButton(rendered, 'Save Preferences'));
    await wait(400);

    const saved = JSON.parse(localStorage.getItem('brilla-appearance') || '{}');
    expect(saved.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(rendered.textContent).toContain('Appearance settings saved!');
    document.documentElement.classList.remove('dark');
  });

  it('loads telegram and email choices on the notifications tab and saves toggles', async () => {
    const rendered = await render();
    await click(findButton(rendered, 'Notifications'));

    expect(mocks.apiGet).toHaveBeenCalledWith('/notifications/telegram/status');
    expect(mocks.apiGet).toHaveBeenCalledWith('/marketing/preferences');
    expect(rendered.textContent).toContain('Connect Telegram');

    const toggle = rendered.querySelector('input[type="checkbox"]');
    await act(async () => {
      toggle?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await click(findButton(rendered, 'Save Preferences'));
    await wait(600);

    expect(rendered.textContent).toContain('Preferences saved!');
  });
});
