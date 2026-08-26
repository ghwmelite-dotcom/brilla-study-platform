// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  fetchDailyUsage: vi.fn(async () => undefined),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: mocks.isAuthenticated }),
}));

vi.mock('@/stores/usageStore', () => ({
  useUsageStore: () => ({
    dailyUsage: null,
    isLoading: false,
    fetchDailyUsage: mocks.fetchDailyUsage,
  }),
}));

vi.mock('@/config', () => ({ formatTimeUntilReset: () => 'resets soon' }));
vi.mock('@/utils', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
}));

import { DailyUsageIndicator } from '../DailyUsageIndicator';

describe('DailyUsageIndicator authentication boundary', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mocks.isAuthenticated = false;
    mocks.fetchDailyUsage.mockClear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  async function renderIndicator() {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <DailyUsageIndicator />
        </MemoryRouter>,
      );
      await Promise.resolve();
    });
  }

  it('does not fetch or render protected usage information for guests', async () => {
    await renderIndicator();
    expect(mocks.fetchDailyUsage).not.toHaveBeenCalled();
    expect(container.children).toHaveLength(0);
  });

  it('fetches usage when authentication becomes active', async () => {
    await renderIndicator();
    mocks.isAuthenticated = true;
    await renderIndicator();
    expect(mocks.fetchDailyUsage).toHaveBeenCalledTimes(1);
  });
});
