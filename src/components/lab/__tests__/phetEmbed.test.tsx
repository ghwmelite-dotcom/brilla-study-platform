// @vitest-environment jsdom
// Regression: ISSUE-QA-LAB-002 — a failed or slow PhET iframe load (observed as
// upstream 429s from phet.colorado.edu) rendered a permanent empty black box
// with no loading, error, or recovery affordance.
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

import { PhETEmbed } from '../PhETEmbed';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SIM_URL = 'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_en.html';

describe('PhETEmbed loading and recovery UX', () => {
  let container: HTMLDivElement;
  let root: Root;

  async function render() {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(<PhETEmbed simUrl={SIM_URL} title="Pendulum Lab" />);
    });
    return container;
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it('shows a loading indicator until the iframe fires load', async () => {
    const rendered = await render();
    expect(rendered.textContent).toContain('Loading simulation');

    const iframe = rendered.querySelector('iframe');
    expect(iframe?.src).toBe(SIM_URL);
    await act(async () => {
      iframe?.dispatchEvent(new Event('load'));
    });

    expect(rendered.textContent).not.toContain('Loading simulation');
  });

  it('offers retry and open-in-new-tab when the load stalls past the timeout', async () => {
    const rendered = await render();

    await act(async () => {
      vi.advanceTimersByTime(21000);
    });

    expect(rendered.textContent).toContain('taking longer than usual');
    const retry = [...rendered.querySelectorAll('button')].find((b) => b.textContent?.includes('Retry'));
    expect(retry).toBeTruthy();

    const firstIframe = rendered.querySelector('iframe');
    await act(async () => {
      retry?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Retry remounts the iframe and restarts the loading cycle
    const secondIframe = rendered.querySelector('iframe');
    expect(secondIframe).not.toBe(firstIframe);
    expect(secondIframe?.src).toBe(SIM_URL);
    expect(rendered.textContent).toContain('Loading simulation');
    expect(rendered.textContent).not.toContain('taking longer than usual');
  });
});
