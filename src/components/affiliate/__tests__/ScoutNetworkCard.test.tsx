// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AffiliateDashboard } from '@/types';
import { ScoutNetworkCard } from '../ScoutNetworkCard';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const dashboard: AffiliateDashboard = {
  stats: {
    totalReferrals: 8,
    referralsThisMonth: 4,
    conversionsThisMonth: 2,
    successfulConversions: 3,
    clicksThisWeek: 7,
    totalClicks: 21,
    earningsThisMonth: 36,
    totalEarnings: 84,
    pendingEarnings: 24,
    availableEarnings: 60,
    conversionRate: 37.5,
  },
  networkStatus: { pending: 2, trial: 2, converted: 3, churned: 1 },
  ranking: { rank: 5, totalParticipants: 40, percentile: 90 },
  tier: {
    id: 'tier_scout',
    name: 'scout',
    title: 'Scout',
    commissionRate: 0.25,
    badgeIcon: 'compass',
    badgeColor: 'green',
  },
  recentReferrals: [{
    id: 'referral_1',
    name: 'Private Student',
    role: 'student',
    status: 'pending',
    signupAt: '2026-08-23T00:00:00.000Z',
  }],
  activeCampaigns: [],
  referralCode: 'AMA123XY',
  referralLink: 'https://brillaprep.org/ref/AMA123XY',
};

describe('ScoutNetworkCard', () => {
  let container: HTMLDivElement;
  let root: Root;
  const writeText = vi.fn(async () => undefined);

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  async function render(loader: () => Promise<{ success: boolean; data?: AffiliateDashboard; error?: string }>) {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <ScoutNetworkCard loadDashboard={loader} />
        </MemoryRouter>,
      );
    });
  }

  it('shows real network stages, rank, earnings, and a copyable Scout link without referral identities', async () => {
    await render(vi.fn(async () => ({ success: true, data: dashboard })));

    expect(container.textContent).toContain('Your Scout network');
    expect(container.textContent).toContain('21');
    expect(container.textContent).toContain('8');
    expect(container.textContent).toContain('3');
    expect(container.textContent).toContain('#5 of 40');
    expect(container.textContent).toContain('2 new');
    expect(container.textContent).toContain('2 in trial');
    expect(container.textContent).toContain('3 subscribed');
    expect(container.textContent).not.toContain('Private Student');

    const copyButton = container.querySelector<HTMLButtonElement>('button[aria-label="Copy Scout invite link"]');
    await act(async () => copyButton?.click());
    expect(writeText).toHaveBeenCalledWith(dashboard.referralLink);
    expect(container.textContent).toContain('Copied');

    const hubLink = container.querySelector<HTMLAnchorElement>('a[href="/affiliate"]');
    expect(hubLink?.textContent).toContain('Open Scout hub');
  });

  it('turns a zero network into a clear first-share action', async () => {
    const emptyDashboard: AffiliateDashboard = {
      ...dashboard,
      stats: { ...dashboard.stats, totalReferrals: 0, successfulConversions: 0, totalClicks: 0 },
      networkStatus: { pending: 0, trial: 0, converted: 0, churned: 0 },
    };

    await render(vi.fn(async () => ({ success: true, data: emptyDashboard })));

    expect(container.textContent).toContain('Your Scout trail starts here');
    expect(container.textContent).toContain('Share your personal link');
  });

  it('offers a retry when the summary cannot load', async () => {
    const loader = vi.fn()
      .mockResolvedValueOnce({ success: false, error: 'Network error' })
      .mockResolvedValueOnce({ success: true, data: dashboard });

    await render(loader);
    expect(container.textContent).toContain('Scout stats are temporarily unavailable');

    const retry = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Try again'),
    );
    await act(async () => retry?.click());

    expect(loader).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('Your Scout network');
  });
});
