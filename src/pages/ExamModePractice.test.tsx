// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Question } from '@/types';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const questions: Question[] = [
  {
    id: 'agric-1',
    topicId: 'soil-science',
    subjectId: 'wassce-agricultural-science',
    questionText: 'Which soil layer contains the most humus?',
    questionType: 'multiple_choice',
    roundType: 'standard',
    options: [
      { id: 'A', text: 'Topsoil' },
      { id: 'B', text: 'Bedrock' },
    ],
    correctAnswer: '',
    difficulty: 'easy',
    points: 1,
    marks: 1,
    timeLimit: 0,
    createdAt: '2026-08-25T00:00:00.000Z',
  },
  {
    id: 'agric-2',
    topicId: 'crop-production',
    subjectId: 'wassce-agricultural-science',
    questionText: 'Which practice reduces soil erosion?',
    questionType: 'multiple_choice',
    roundType: 'standard',
    options: [
      { id: 'A', text: 'Contour ploughing' },
      { id: 'B', text: 'Bush burning' },
    ],
    correctAnswer: '',
    difficulty: 'easy',
    points: 1,
    marks: 1,
    timeLimit: 0,
    createdAt: '2026-08-25T00:00:00.000Z',
  },
];

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  navigate: vi.fn(),
  fetchDailyUsage: vi.fn(),
  setUsageFromResponse: vi.fn(),
  checkLimitReached: vi.fn(() => false),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams('mode=drill&subject=wassce-agricultural-science&count=2')],
  useLocation: () => ({ state: { questions } }),
}));
vi.mock('@/lib/api', () => ({ api: { post: mocks.apiPost, get: vi.fn() } }));
vi.mock('@/utils', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
}));
vi.mock('@/components/exam', async () => ({
  ExamLayout: (await import('@/components/exam/ExamLayout')).ExamLayout,
  ExamQuestionCard: (await import('@/components/exam/ExamQuestionCard')).ExamQuestionCard,
}));
vi.mock('@/stores/examStore', () => ({ useExamStore: () => ({ currentExamType: 'wassce' }) }));
vi.mock('@/stores/themeStore', () => ({
  useThemeStore: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }),
}));
vi.mock('@/stores/uiStore', () => ({ useUIStore: () => ({ setDistractionFreeMode: vi.fn() }) }));
vi.mock('@/stores/usageStore', () => ({
  useUsageStore: () => ({
    dailyUsage: { used: 0, limit: -1, remaining: -1, isPremium: true, isUnlimited: true },
    fetchDailyUsage: mocks.fetchDailyUsage,
    setUsageFromResponse: mocks.setUsageFromResponse,
    checkLimitReached: mocks.checkLimitReached,
  }),
}));
vi.mock('@/components/subscription', () => ({
  DailyUsageIndicator: () => null,
  LimitReachedModal: () => null,
}));

import ExamModePractice from './ExamModePractice';

const mounted: Array<{ container: HTMLDivElement; root: ReturnType<typeof createRoot> }> = [];

async function renderPage() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ container, root });
  await act(async () => {
    root.render(<ExamModePractice />);
    await Promise.resolve();
  });
  return container;
}

function findButton(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button'))
    .find((candidate) => candidate.textContent?.trim().includes(text));
  if (!button) throw new Error(`Button not found: ${text}`);
  return button;
}

beforeEach(() => {
  mocks.apiPost.mockReset();
  mocks.navigate.mockReset();
  mocks.fetchDailyUsage.mockReset();
  mocks.setUsageFromResponse.mockReset();
  mocks.checkLimitReached.mockReset().mockReturnValue(false);
});

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => entry.root.unmount());
    entry.container.remove();
  }
});

describe('ExamModePractice question transition', () => {
  it('surfaces a failed attempt, allows retry, and advances after the retry succeeds', async () => {
    mocks.apiPost
      .mockResolvedValueOnce({ success: false, error: 'Failed to submit answer' })
      .mockResolvedValueOnce({
        success: true,
        data: {
          isCorrect: true,
          correctAnswer: 'A',
          explanation: 'Topsoil contains the greatest concentration of humus.',
          pointsEarned: 1,
          usage: { used: 0, limit: -1, remaining: -1, isUnlimited: true, showUpgradePrompt: false },
        },
      });

    const container = await renderPage();
    const firstAnswer = findButton(container, 'Topsoil');

    await act(async () => {
      firstAnswer.click();
      await Promise.resolve();
    });

    await vi.waitFor(() => expect(container.textContent).toContain('Failed to submit answer'));
    expect(findButton(container, 'Next').disabled).toBe(true);

    await act(async () => {
      findButton(container, 'Topsoil').click();
      await Promise.resolve();
    });

    await vi.waitFor(() => expect(findButton(container, 'Next').disabled).toBe(false));
    await act(async () => findButton(container, 'Next').click());
    expect(container.textContent).toContain('Question 2');
    expect(container.textContent).toContain('Which practice reduces soil erosion?');
  });
});
