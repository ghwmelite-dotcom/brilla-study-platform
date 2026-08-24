// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Subject } from '@/types';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  subjectSlug: undefined as string | undefined,
  examStore: {} as Record<string, unknown>,
  apiGet: vi.fn(),
  progressGet: vi.fn(),
  fetchDailyUsage: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
  useParams: () => ({ subjectSlug: mocks.subjectSlug }),
}));
vi.mock('@/components/common', () => ({
  Badge: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  Button: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) => <button onClick={onClick}>{children}</button>,
  Card: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Input: () => <input />,
  ProgressBar: () => <div />,
}));
vi.mock('@/components/subscription', () => ({ DailyUsageIndicator: () => null, PremiumSubjectBadge: () => <span>Premium</span> }));
vi.mock('@/stores/examStore', () => ({ useExamStore: () => mocks.examStore, mapApiSubject: (row: unknown) => row }));
vi.mock('@/stores/usageStore', () => ({ useUsageStore: () => ({ dailyUsage: { isUnlimited: false, isPremium: false }, fetchDailyUsage: mocks.fetchDailyUsage }) }));
vi.mock('@/lib/api', () => ({ api: { get: mocks.apiGet } }));
vi.mock('@/lib/services', () => ({ progressService: { getProgress: mocks.progressGet } }));
vi.mock('@/config', () => ({ isCoreSubject: () => false }));
vi.mock('@/lib/subjectIcons', () => ({ getSubjectIcon: () => () => null }));
vi.mock('@/utils', () => ({ cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ') }));

import { TopicsPage } from './Topics';

const unavailableSubject: Subject = {
  id: 'empty-subject', name: 'Empty Subject', slug: 'empty-subject', icon: 'book', color: '#2563EB',
  isActive: true, displayOrder: 1, questionCount: 0, topicCount: 0, availabilityStatus: 'unavailable',
};

const liveSubject = (id: string, slug: string, name: string): Subject => ({
  id, slug, name, icon: 'book', color: '#2563EB', isActive: true, displayOrder: 1,
  questionCount: 20, topicCount: 1, availabilityStatus: 'available', contentReviewStatus: 'legacy_unreviewed',
});

function examStore(overrides: Record<string, unknown> = {}) {
  return {
    subjects: [unavailableSubject], initializeExamData: vi.fn(), fetchSubjects: vi.fn(),
    currentExamType: 'wassce', isLoadingSubjects: false, error: null, ...overrides,
  };
}

async function renderClient() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<TopicsPage />);
    await Promise.resolve();
  });
  return { container, root };
}

beforeEach(() => {
  mocks.subjectSlug = undefined;
  mocks.examStore = examStore();
  mocks.apiGet.mockReset();
  mocks.progressGet.mockReset().mockResolvedValue(null);
  mocks.fetchDailyUsage.mockReset();
});

describe('TopicsPage subject availability', () => {
  it('shows retry after an independent live subject request fails', async () => {
    mocks.subjectSlug = 'empty-subject';
    mocks.examStore = examStore({ subjects: [{ ...unavailableSubject, availabilityStatus: 'unknown' }] });
    mocks.apiGet.mockRejectedValueOnce(new Error('Connection interrupted'));
    const { container, root } = await renderClient();
    await vi.waitFor(() => expect(container.textContent).toContain('Live subject availability could not be loaded'));
    expect(container.textContent).toContain('Connection interrupted');
    expect(container.textContent).toContain('Try again');
    await act(async () => root.unmount());
    container.remove();
  });

  it('shows retry when the top-level catalogue request fails', () => {
    mocks.examStore = examStore({
      subjects: [{ ...unavailableSubject, availabilityStatus: 'unknown' }],
      error: 'Catalogue unavailable',
    });
    const html = renderToStaticMarkup(<TopicsPage />);
    expect(html).toContain('Live subject availability could not be loaded');
    expect(html).toContain('Catalogue unavailable');
    expect(html).toContain('Try again');
    expect(html).not.toContain('Checking availability');
  });

  it('never presents an unavailable Topic Library subject as a premium upsell', () => {
    const html = renderToStaticMarkup(<TopicsPage />);
    expect(html).toContain('Empty Subject: Not yet available');
    expect(html).toContain('Not yet available');
    expect(html).not.toContain('Upgrade to Access');
  });

  it('resolves a cross-exam direct link without relying on the persisted catalogue', async () => {
    const subject = liveSubject('subj_igcse_math', 'igcse-mathematics', 'IGCSE Mathematics');
    mocks.subjectSlug = subject.slug;
    mocks.examStore = examStore({ subjects: [] });
    mocks.apiGet.mockImplementation(async (url: string) => {
      if (url.startsWith('/subjects/')) return { success: true, data: subject };
      if (url === `/topics?subject=${subject.id}`) return { success: true, data: [] };
      throw new Error(`Unexpected URL: ${url}`);
    });
    const { container, root } = await renderClient();
    await vi.waitFor(() => expect(container.textContent).toContain('IGCSE Mathematics'));
    expect(container.textContent).not.toContain('Subject not found');
    await act(async () => root.unmount());
    container.remove();
  });

  it('ignores a stale topic response after navigating to another subject', async () => {
    const subjectA = liveSubject('subject-a', 'subject-a', 'Subject A');
    const subjectB = liveSubject('subject-b', 'subject-b', 'Subject B');
    let resolveA: ((value: { success: boolean; data: Array<Record<string, unknown>> }) => void) | undefined;
    const topicsA = new Promise<{ success: boolean; data: Array<Record<string, unknown>> }>((resolve) => { resolveA = resolve; });
    mocks.subjectSlug = subjectA.slug;
    mocks.examStore = examStore({ subjects: [] });
    mocks.apiGet.mockImplementation(async (url: string) => {
      if (url === '/subjects/subject-a') return { success: true, data: subjectA };
      if (url === '/subjects/subject-b') return { success: true, data: subjectB };
      if (url === '/topics?subject=subject-a') return topicsA;
      if (url === '/topics?subject=subject-b') return { success: true, data: [{ id: 'topic-b', subject_id: 'subject-b', parent_id: null, name: 'Topic B', slug: 'topic-b', description: '', questionCount: 1 }] };
      throw new Error(`Unexpected URL: ${url}`);
    });
    const { container, root } = await renderClient();
    await vi.waitFor(() => expect(mocks.apiGet).toHaveBeenCalledWith('/topics?subject=subject-a'));
    mocks.subjectSlug = subjectB.slug;
    await act(async () => { root.render(<TopicsPage />); await Promise.resolve(); });
    await vi.waitFor(() => expect(container.textContent).toContain('Topic B'));
    await act(async () => {
      resolveA?.({ success: true, data: [{ id: 'topic-a', subject_id: 'subject-a', parent_id: null, name: 'Stale Topic A', slug: 'topic-a', description: '', questionCount: 1 }] });
      await Promise.resolve();
    });
    expect(container.textContent).not.toContain('Stale Topic A');
    expect(container.textContent).toContain('Topic B');
    await act(async () => root.unmount());
    container.remove();
  });
});