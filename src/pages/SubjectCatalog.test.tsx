import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Subject } from '@/types';

const mocks = vi.hoisted(() => ({ examStore: {} as Record<string, unknown>, usageStore: {} as Record<string, unknown> }));
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children?: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useNavigate: () => vi.fn(),
}));
vi.mock('@/components/common', () => ({
  Badge: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  Button: ({ children }: { children?: React.ReactNode }) => <button>{children}</button>,
  Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/subscription', () => ({ DailyUsageIndicator: () => null, PremiumSubjectBadge: () => <span>Premium</span> }));
vi.mock('@/stores/examStore', () => ({ useExamStore: () => mocks.examStore }));
vi.mock('@/stores/usageStore', () => ({ useUsageStore: () => mocks.usageStore }));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: false }),
}));
vi.mock('@/lib/subjectIcons', () => ({ getSubjectIcon: () => () => null }));
vi.mock('@/utils', () => ({ cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ') }));

import { SubjectCard, SubjectCatalogPage } from './SubjectCatalog';

const baseSubject: Subject = {
  id: 'subject-1', name: 'Mathematics', slug: 'mathematics', icon: 'calculator', color: '#2563eb',
  description: 'Practice Mathematics', isActive: true, displayOrder: 1, topicCount: 4,
  questionCount: 20, availabilityStatus: 'available',
};

beforeEach(() => {
  mocks.examStore = {
    currentExamType: 'wassce', subjects: [], categories: [], isLoadingSubjects: false, error: null,
    initializeExamData: vi.fn(), fetchSubjects: vi.fn(), fetchCategories: vi.fn(),
  };
  mocks.usageStore = { dailyUsage: null, fetchDailyUsage: vi.fn() };
});

describe('SubjectCard availability behavior', () => {
  it('renders an unavailable premium subject as non-interactive before any upgrade path', () => {
    const subject: Subject = { ...baseSubject, id: 'empty-subject', name: 'Empty Subject', slug: 'empty-subject', questionCount: 0, availabilityStatus: 'unavailable' };
    const html = renderToStaticMarkup(<SubjectCard subject={subject} viewMode="grid" isLocked onLockedClick={vi.fn()} />);
    expect(html).toContain('Empty Subject: Not yet available');
    expect(html).toContain('0 questions');
    expect(html).not.toContain('href="/topics/empty-subject"');
    expect(html).not.toContain('premium subject');
  });

  it('keeps a limited bank usable and labels the repetition risk', () => {
    const subject: Subject = { ...baseSubject, id: 'limited-subject', name: 'Limited Subject', slug: 'limited-subject', questionCount: 19, availabilityStatus: 'limited' };
    const html = renderToStaticMarkup(<SubjectCard subject={subject} viewMode="grid" isLocked={false} onLockedClick={vi.fn()} />);
    expect(html).toContain('href="/topics/limited-subject"');
    expect(html).toContain('Limited bank');
    expect(html).toContain('expect repetition while this bank grows');
    expect(html).toContain('19 questions');
  });

  it('discloses legacy banks that are still awaiting academic review', () => {
    const html = renderToStaticMarkup(
      <SubjectCard subject={{ ...baseSubject, contentReviewStatus: 'legacy_unreviewed' }} viewMode="grid" isLocked={false} onLockedClick={vi.fn()} />,
    );
    expect(html).toContain('Academic review pending');
    expect(html).toContain('has not yet completed independent academic review');
  });

  it('labels automated content as a transparent beta bank without a reviewer warning', () => {
    const html = renderToStaticMarkup(
      <SubjectCard subject={{ ...baseSubject, contentReviewStatus: 'automated_beta' }} viewMode="grid" isLocked={false} onLockedClick={vi.fn()} />,
    );
    expect(html).toContain('Beta practice bank');
    expect(html).toContain('not official exam-board questions');
    expect(html).not.toContain('Academic review pending');
  });
  it('does not show academic-review copy for an empty bank', () => {
    const html = renderToStaticMarkup(
      <SubjectCard
        subject={{ ...baseSubject, questionCount: 0, availabilityStatus: 'unavailable', contentReviewStatus: 'legacy_unreviewed' }}
        viewMode="grid"
        isLocked={false}
        onLockedClick={vi.fn()}
      />,
    );
    expect(html).not.toContain('Academic review pending');
    expect(html).not.toContain('independent academic review');
  });
});

describe('SubjectCatalogPage live summary', () => {
  it.each([
    { isLoadingSubjects: true, error: null, message: 'Loading live question-bank availability' },
    { isLoadingSubjects: false, error: 'Catalogue unavailable', message: 'Live availability could not be loaded' },
  ])('does not present missing live counts as zeros: $message', (state) => {
    mocks.examStore = {
      ...mocks.examStore,
      ...state,
      subjects: [{ ...baseSubject, questionCount: 0, topicCount: 0, availabilityStatus: 'unknown' }],
    };
    const html = renderToStaticMarkup(<SubjectCatalogPage />);
    expect(html).toContain(state.message);
    if (state.error) expect(html).not.toContain('Loading live question-bank availability');
    expect(html.match(/>—<\/p>/g)).toHaveLength(3);
    expect(html).not.toContain('>0</p><p class="text-sm text-neutral-600">Available now');
  });
});
