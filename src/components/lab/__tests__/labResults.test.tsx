// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom lacks matchMedia; themeStore calls it at module scope on import.
vi.hoisted(() => {
  if (typeof window !== 'undefined' && !window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
});

import { LabWorkspace } from '../LabWorkspace';
import { ExperimentCard } from '../ExperimentCard';
import { useLabStore } from '@/stores/labStore';
import { useUsageStore } from '@/stores/usageStore';
import { getExperimentBySlug } from '@/data/experiments';
import type { Experiment, GradingResult, LabSession } from '@/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/lib/api', () => ({
  api: {
    startLabSession: vi.fn(),
    appendLabEvents: vi.fn(),
    submitLabSession: vi.fn(),
    get: vi.fn(),
  },
}));

const titration = getExperimentBySlug('acid-base-titration')!;
const phet = getExperimentBySlug('ohms-law')!;

const makeSession = (experiment: Experiment): LabSession => ({
  id: 'sess_1',
  userId: 'user_1',
  experimentId: experiment.id,
  mode: 'guided',
  status: 'in_progress',
  currentStepIndex: 0,
  startedAt: new Date().toISOString(),
  timeSpent: 0,
  stepProgress: [],
  measurements: [],
  observations: [],
});

const serverResult: GradingResult = {
  totalScore: 6,
  maxScore: 10,
  percentageScore: 60,
  criteriaScores: [
    { criterionId: 'c1', criterionName: 'Procedure', score: 4, maxScore: 5, feedback: 'Followed most steps in order' },
    { criterionId: 'c2', criterionName: 'Accuracy', score: 2, maxScore: 5, feedback: 'Titre outside tolerance' },
  ],
  stepScores: [
    { stepNumber: 1, marksEarned: 2, maxMarks: 2, evidence: 'sim_verified', feedback: 'Verified by simulation events' },
    { stepNumber: 2, marksEarned: 1, maxMarks: 2, evidence: 'self_report_only', feedback: 'Self-reported completion only' },
  ],
};

const freeUsage = {
  used: 0,
  limit: 10,
  remaining: 10,
  resetsAt: new Date().toISOString(),
  isPremium: false,
  isUnlimited: false,
};

describe('Lab results UI', () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = async (ui: React.ReactElement) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(ui);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useLabStore.getState().reset();
    useUsageStore.setState({ dailyUsage: freeUsage });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    useLabStore.getState().reset();
  });

  it('renders criterion feedback and the self-reported step badge from a server GradingResult', async () => {
    useLabStore.setState({
      currentExperiment: titration,
      currentSession: makeSession(titration),
      stepCompletionStatus: titration.procedure.map(() => true),
      lastAttemptResult: serverResult,
    });

    await render(<LabWorkspace onExit={() => {}} />);

    expect(container.textContent).toContain('Titre outside tolerance');
    expect(container.textContent).toContain('Followed most steps in order');
    expect(container.textContent).toContain('Step Evidence');
    expect(container.textContent).toContain('Self-reported');
    expect(container.textContent).toContain('Verified by simulation events');
    expect(container.textContent).toContain('60%');
  });

  it('shows the pending-grading card instead of a score when submitPending is set', async () => {
    useLabStore.setState({
      currentExperiment: titration,
      currentSession: makeSession(titration),
      stepCompletionStatus: titration.procedure.map(() => false),
      submitPending: true,
    });

    await render(<LabWorkspace onExit={() => {}} />);

    expect(container.textContent).toContain('Grading is pending');
    expect(container.textContent).not.toContain('Performance Breakdown');
  });

  it('shows the practice badge and Finish practice instead of Submit for PhET experiments', async () => {
    useLabStore.setState({
      currentExperiment: phet,
      currentSession: makeSession(phet),
      mode: 'guided',
      stepCompletionStatus: phet.procedure.map(() => false),
    });

    await render(<LabWorkspace onExit={() => {}} />);

    expect(container.textContent).toContain('Practice mode — ungraded');
    const buttonLabels = Array.from(container.querySelectorAll('button')).map((b) => b.textContent ?? '');
    expect(buttonLabels.some((label) => label.includes('Finish practice'))).toBe(true);
    expect(buttonLabels.some((label) => label.includes('Submit'))).toBe(false);
  });

  it('locks premium experiments for free users and opens them for premium users', async () => {
    const premiumExperiment: Experiment = { ...titration, isPremium: true };

    await render(<ExperimentCard experiment={premiumExperiment} onStart={() => {}} />);
    expect(container.textContent).toContain('Unlock with Premium');
    expect(container.textContent).toContain('Premium');

    await act(async () => root.unmount());
    container.remove();

    useUsageStore.setState({ dailyUsage: { ...freeUsage, isPremium: true } });
    await render(<ExperimentCard experiment={premiumExperiment} onStart={() => {}} />);
    expect(container.textContent).toContain('Start Experiment');
    expect(container.textContent).not.toContain('Unlock with Premium');
  });
});
