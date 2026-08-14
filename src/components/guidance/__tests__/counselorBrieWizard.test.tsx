// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CounselorBrieWizard } from '../CounselorBrieWizard';
import { shouldAutoLaunchBrie } from '../triggerPolicy';
import { useGuidanceStore, type BriePlan, type PublicQuestion } from '@/stores/guidanceStore';
import { useExamStore } from '@/stores/examStore';
import { getGuidanceGradeScale, toGuidanceExamType } from '@/lib/guidanceExamCatalog';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
window.requestAnimationFrame = (callback: FrameRequestCallback) => {
  callback(0);
  return 1;
};

const containers: Array<{ container: HTMLDivElement; root: Root }> = [];

async function renderWizard() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  containers.push({ container, root });
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(CounselorBrieWizard)));
  });
  return container;
}

beforeEach(() => {
  useExamStore.setState({ currentExamType: 'wassce' });
  useGuidanceStore.setState({
    wizardOpen: true,
    currentQuestion: null,
    plan: null,
    readiness: null,
    evidence: null,
    activeExamType: null,
    activeSubjectId: null,
    lastAnswer: null,
    error: null,
    isLoading: false,
  });
});

afterEach(async () => {
  while (containers.length > 0) {
    const item = containers.pop();
    if (!item) continue;
    await act(async () => item.root.unmount());
    item.container.remove();
  }
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('CounselorBrieWizard', () => {
  it('renders an accessible goal intake with the current exam and AI guide notice', async () => {
    const container = await renderWizard();
    const dialog = container.querySelector('[role="dialog"]');
    const exam = container.querySelector<HTMLSelectElement>('select[aria-label="Exam"]');

    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(exam?.value).toBe('wassce');
    expect(container.querySelector('select[aria-label="Subject"]')).toBeTruthy();
    expect(container.querySelector('select[aria-label="Target grade"]')).toBeTruthy();
    expect(container.textContent).toContain('AI academic guide, not a human counselor');
  });

  it('uses canonical grade scales and mappings, including corrected Edexcel grades', () => {
    expect(toGuidanceExamType('cambridge-a-level')).toBe('cambridge_a2');
    expect(getGuidanceGradeScale('edexcel-igcse')).toEqual(['9', '8', '7', '6', '5', '4', '3', '2', '1']);
    expect(getGuidanceGradeScale('edexcel-as')).toEqual(['A*', 'A', 'B', 'C', 'D', 'E']);
  });

  it('never renders a correct answer supplied on an invalid public-question object', async () => {
    const question = {
      id: 'q1',
      questionText: 'Which option is correct?',
      questionType: 'multiple_choice',
      options: ['Option A', 'Option B'],
      difficulty: 'medium',
      topicName: 'Algebra',
      correctAnswer: 'SECRET ANSWER',
    } satisfies PublicQuestion & { correctAnswer: string };
    useGuidanceStore.setState({ currentQuestion: question, askedSoFar: 0, target: 9 });

    const container = await renderWizard();
    expect(container.textContent).toContain('Which option is correct?');
    expect(container.textContent).not.toContain('SECRET ANSWER');
  });

  it('labels the result as provisional and exposes evidence quality', async () => {
    const plan: BriePlan = {
      goal: null,
      readiness: 63,
      readinessSource: 'assessment',
      readinessBand: 60,
      roadmap: [],
      thisWeek: [],
      narrative: 'Start with algebra, then strengthen geometry.',
      narrativeCached: false,
      fallback: false,
      evidenceCount: 9,
      topicCoverage: { covered: 3, total: 5, ratio: 0.6 },
      freshness: '2026-08-14T10:00:00.000Z',
      confidence: 'medium',
      algorithmVersion: 'brie-v1',
      completedEarly: false,
    };
    useGuidanceStore.setState({ plan, readiness: 63, evidence: plan });

    const container = await renderWizard();
    expect(container.textContent).toContain('provisional readiness estimate');
    expect(container.textContent).toContain('63/100');
    expect(container.textContent).toContain('9answers');
    expect(container.textContent).toContain('mediumconfidence');
    expect(container.textContent).toContain(plan.narrative);
  });
});

describe('CounselorBrieTrigger policy', () => {
  it('launches only for an authenticated student when enabled and outside cooldown', () => {
    const baseline = {
      enabled: true,
      isAuthenticated: true,
      role: 'student',
      wizardOpen: false,
      coolingDown: false,
    };
    expect(shouldAutoLaunchBrie(baseline)).toBe(true);
    expect(shouldAutoLaunchBrie({ ...baseline, role: 'teacher' })).toBe(false);
    expect(shouldAutoLaunchBrie({ ...baseline, enabled: false })).toBe(false);
    expect(shouldAutoLaunchBrie({ ...baseline, coolingDown: true })).toBe(false);
    expect(shouldAutoLaunchBrie({ ...baseline, wizardOpen: true })).toBe(false);
  });
});
