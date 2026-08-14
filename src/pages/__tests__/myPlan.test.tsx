// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const fetchGoals = vi.fn(async () => []);
const fetchPlan = vi.fn(async () => undefined);
const regeneratePlan = vi.fn(async () => 'ok' as const);
const startAssessment = vi.fn(async () => 'quiz' as const);
const openWizard = vi.fn();
const resetQuiz = vi.fn();

const guidanceState = {
  goals: [
    {
      id: 'goal-1',
      examType: 'wassce',
      subjectId: 'subj_wassce_core_math',
      targetGrade: 'A1',
      examYear: 2027,
      examMonth: 5,
      updatedAt: '2026-08-14T08:00:00.000Z',
    },
  ],
  plan: {
    goal: {
      id: 'goal-1',
      examType: 'wassce',
      subjectId: 'subj_wassce_core_math',
      targetGrade: 'A1',
      examYear: 2027,
      examMonth: 5,
      updatedAt: '2026-08-14T08:00:00.000Z',
    },
    readiness: 63,
    readinessSource: 'assessment' as const,
    readinessBand: 60,
    evidenceCount: 9,
    topicCoverage: { covered: 3, total: 5, ratio: 0.6 },
    freshness: '2026-08-14T08:00:00.000Z',
    confidence: 'medium' as const,
    algorithmVersion: 'brie-readiness-v1',
    completedEarly: false,
    narrative: 'Your first route is ready. We will sharpen it as you practise. — Brie',
    narrativeCached: false,
    fallback: true,
    roadmap: [
      {
        topicId: 'topic-algebra',
        topicName: 'Algebra',
        masteryScore: 22,
        questionsAttempted: 3,
        priority: 'critical' as const,
        reason: 'weak_area' as const,
        estimatedTime: 45,
        href: '/untrusted-path',
      },
      {
        topicId: 'topic-geometry',
        topicName: 'Geometry',
        masteryScore: 0,
        questionsAttempted: 0,
        priority: 'high' as const,
        reason: 'not_started' as const,
        estimatedTime: 45,
        href: '/untrusted-path',
      },
      {
        topicId: 'topic-statistics',
        topicName: 'Statistics',
        masteryScore: 55,
        questionsAttempted: 8,
        priority: 'medium' as const,
        reason: 'review_needed' as const,
        estimatedTime: 30,
        href: '/untrusted-path',
      },
    ],
    thisWeek: [] as typeof guidanceState.plan.roadmap,
  },
  isLoading: false,
  error: null,
  fetchGoals,
  fetchPlan,
  regeneratePlan,
  startAssessment,
  openWizard,
  resetQuiz,
};
guidanceState.plan.thisWeek = guidanceState.plan.roadmap;

vi.mock('@/stores/guidanceStore', () => ({
  useGuidanceStore: () => guidanceState,
}));

import { MyPlan } from '../MyPlan';

describe('MyPlan', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(createElement(MemoryRouter, undefined, createElement(MyPlan)));
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('renders the goal, honest readiness evidence, this-week focus, and roadmap', () => {
    expect(container.textContent).toContain('A1 in Core Mathematics');
    expect(container.textContent).toContain('63%');
    expect(container.textContent).toContain('Provisional readiness estimate');
    expect(container.textContent).toContain('9 attempts');
    expect(container.textContent).toContain('60%');

    const thisWeek = container.querySelector('[aria-labelledby="this-week-heading"]');
    expect(thisWeek?.querySelectorAll('article')).toHaveLength(3);
    expect(container.textContent).toContain('Critical');
    expect(container.textContent).toContain('High');
    expect(container.textContent).toContain('Medium');

    const algebraLink = container.querySelector<HTMLAnchorElement>('a[aria-label="Start Algebra"]');
    expect(algebraLink?.getAttribute('href')).toContain('/revision-classroom?');
    expect(algebraLink?.getAttribute('href')).toContain('exam=wassce');
    expect(algebraLink?.getAttribute('href')).toContain('subject=subj_wassce_core_math');
    expect(algebraLink?.getAttribute('href')).toContain('topic=topic-algebra');
    expect(algebraLink?.getAttribute('href')).not.toContain('untrusted-path');
  });

  it('starts an explicitly forced level-check retake', async () => {
    const retake = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Retake level check'),
    );
    expect(retake).toBeTruthy();

    await act(async () => retake?.click());

    expect(resetQuiz).toHaveBeenCalledOnce();
    expect(openWizard).toHaveBeenCalledOnce();
    expect(startAssessment).toHaveBeenCalledWith('wassce', 'subj_wassce_core_math', {
      forceRetake: true,
    });
  });
});
