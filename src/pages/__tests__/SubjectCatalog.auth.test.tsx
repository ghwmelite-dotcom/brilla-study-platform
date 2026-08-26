// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  authState: { isAuthenticated: false },
  examStore: {
    currentExamType: 'wassce',
    subjects: [],
    categories: [],
    isLoadingSubjects: false,
    error: null,
    initializeExamData: vi.fn(),
    fetchSubjects: vi.fn(),
    fetchCategories: vi.fn(),
  },
  usageStore: {
    dailyUsage: null,
    fetchDailyUsage: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children?: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/components/common', () => ({
  Badge: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Button: ({ children }: { children?: React.ReactNode }) => <button>{children}</button>,
  Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/subscription', () => ({
  DailyUsageIndicator: () => null,
  PremiumSubjectBadge: () => <span>Premium</span>,
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (
    selector: (state: { isAuthenticated: boolean }) => unknown,
  ) => selector(mocks.authState),
}));

vi.mock('@/stores/examStore', () => ({
  useExamStore: () => mocks.examStore,
}));

vi.mock('@/stores/usageStore', () => ({
  useUsageStore: () => mocks.usageStore,
}));

vi.mock('@/config', () => ({
  isCoreSubject: () => false,
}));

vi.mock('@/lib/subjectIcons', () => ({
  getSubjectIcon: () => () => null,
}));

vi.mock('@/utils', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => (
    classes.filter(Boolean).join(' ')
  ),
}));

import { SubjectCatalogPage } from '../SubjectCatalog';

describe('SubjectCatalogPage authentication boundary', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mocks.authState.isAuthenticated = false;
    mocks.examStore.initializeExamData.mockClear();
    mocks.examStore.fetchSubjects.mockClear();
    mocks.examStore.fetchCategories.mockClear();
    mocks.usageStore.fetchDailyUsage.mockClear();

    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('does not call the protected usage route for a guest catalogue visit', async () => {
    await act(async () => {
      root.render(<SubjectCatalogPage />);
    });

    expect(mocks.usageStore.fetchDailyUsage).not.toHaveBeenCalled();
    expect(container.textContent).toContain('WASSCE Subject Catalogue');
  });

  it('loads daily usage after authentication is confirmed', async () => {
    mocks.authState.isAuthenticated = true;

    await act(async () => {
      root.render(<SubjectCatalogPage />);
    });

    expect(mocks.usageStore.fetchDailyUsage).toHaveBeenCalledTimes(1);
  });
});
