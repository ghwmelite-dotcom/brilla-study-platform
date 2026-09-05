// @vitest-environment jsdom
// Regression: ISSUE-QA-LAB-001 — clicking Guided/Sandbox Mode after a failed
// session start (e.g. lab-session-start rate limit) left the modal open with
// no feedback; the student could not tell anything went wrong.
// Found by /qa on 2026-09-05
// Report: .gstack/qa-reports/qa-report-brillaprep-org-2026-09-05.md
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

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  startSession: vi.fn(),
  endSession: vi.fn(),
}));

let labError: string | null;

vi.mock('react-router-dom', () => ({
  useParams: () => ({ experimentSlug: 'acid-base-titration' }),
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/stores/labStore', () => {
  const hook = () => ({
    currentSession: null,
    currentExperiment: null,
    startSession: mocks.startSession,
    endSession: mocks.endSession,
  });
  hook.getState = () => ({ error: labError });
  return { useLabStore: hook };
});

vi.mock('@/components/lab/ExperimentList', () => ({
  ExperimentList: () => <div data-testid="experiment-list" />,
}));
vi.mock('@/components/lab/LabWorkspace', () => ({
  LabWorkspace: () => <div data-testid="lab-workspace" />,
}));

import { VirtualLabPage } from '../VirtualLabPage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('VirtualLabPage mode selection error handling', () => {
  let container: HTMLDivElement;
  let root: Root;

  async function render() {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(<VirtualLabPage />);
    });
    return container;
  }

  async function clickGuided(rendered: HTMLElement) {
    const card = [...rendered.querySelectorAll('h3')].find((h) => h.textContent?.trim() === 'Guided Mode');
    let el: Element | null = card ?? null;
    while (el && !/cursor-pointer/.test(el.className || '') && el.tagName !== 'BUTTON') el = el.parentElement;
    await act(async () => {
      (el as HTMLElement)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    labError = null;
    mocks.startSession.mockImplementation(async () => {});
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('surfaces the session-start error inside the modal instead of failing silently', async () => {
    labError = 'Too many requests. Please slow down.';
    const rendered = await render();
    expect(rendered.textContent).toContain('Select Lab Mode');

    await clickGuided(rendered);

    expect(mocks.startSession).toHaveBeenCalledOnce();
    expect(rendered.querySelector('[role="alert"]')?.textContent).toContain(
      'started a lot of lab sessions in the last hour',
    );
    // Modal stays open so the student can retry
    expect(rendered.textContent).toContain('Select Lab Mode');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('passes through non-rate-limit server errors verbatim', async () => {
    labError = 'Lab service unavailable.';
    const rendered = await render();
    await clickGuided(rendered);
    expect(rendered.querySelector('[role="alert"]')?.textContent).toContain('Lab service unavailable.');
  });

  it('navigates into the workspace when the session starts cleanly', async () => {
    const rendered = await render();
    await clickGuided(rendered);
    expect(rendered.querySelector('[role="alert"]')).toBeNull();
    expect(mocks.navigate).toHaveBeenCalledWith('/virtual-lab/acid-base-titration');
  });

  it('redirects to pricing on the premium gate', async () => {
    labError = 'LAB_PREMIUM_REQUIRED';
    const rendered = await render();
    await clickGuided(rendered);
    expect(mocks.navigate).toHaveBeenCalledWith('/pricing');
  });
});
