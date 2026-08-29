// @vitest-environment jsdom

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Affiliate from '../Affiliate';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  updateMobileMoneyDetails: vi.fn(async () => true),
  fetchProfile: vi.fn(async () => undefined),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'student_1', role: 'student' },
    isAuthenticated: true,
  }),
}));

vi.mock('@/stores/affiliateStore', () => ({
  useAffiliateStore: () => ({
    profile: {
      id: 'affiliate_1',
      userId: 'student_1',
      referralCode: 'BRILLA1',
      referralLink: 'https://brillaprep.org/register?ref=BRILLA1',
      tier: {
        id: 'scout',
        name: 'scout',
        title: 'Scout',
        minReferrals: 1,
        maxReferrals: 5,
        commissionRate: 0.25,
        badgeIcon: 'S',
        badgeColor: 'green',
        xpBonus: 0,
        perks: [],
      },
      stats: {
        totalReferrals: 0,
        successfulConversions: 0,
        effectiveReferrals: 0,
        totalClicks: 0,
        conversionRate: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        availableEarnings: 0,
        affiliateXP: 0,
      },
      nextTier: null,
      isTeacher: false,
      teacherBonus: 1,
      joinedAt: '2026-08-29T00:00:00Z',
    },
    dashboard: null,
    referrals: [],
    challenges: [],
    leaderboard: [],
    schoolLeaderboard: [],
    isAffiliate: true,
    isLoading: false,
    error: null,
    fetchProfile: mocks.fetchProfile,
    fetchDashboard: vi.fn(),
    fetchReferrals: vi.fn(),
    fetchChallenges: vi.fn(),
    fetchLeaderboard: vi.fn(),
    fetchSchoolLeaderboard: vi.fn(),
    joinProgram: vi.fn(),
    claimChallenge: vi.fn(),
    copyReferralLink: vi.fn(),
    updateMobileMoneyDetails: mocks.updateMobileMoneyDetails,
  }),
}));

vi.mock('@/components/affiliate', () => ({
  AffiliateGuide: () => null,
  ReferralEmailConsentCard: () => null,
}));

vi.mock('@/components/common/Modal', () => ({
  Modal: ({
    isOpen,
    title,
    description,
    children,
  }: {
    isOpen: boolean;
    title?: string;
    description?: string;
    children: ReactNode;
  }) => (
    isOpen ? (
      <div role="dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
      </div>
    ) : null
  ),
}));

describe('Affiliate Mobile Money setup', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        <MemoryRouter>
          <Affiliate />
        </MemoryRouter>,
      );
    });

    const earningsTab = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Earnings',
    );
    await act(async () => earningsTab?.click());
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('opens a setup form from the empty Mobile Money state', async () => {
    const setupButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Set Up Mobile Money'),
    );

    await act(async () => setupButton?.click());

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain('Add your Mobile Money details');
  });

  it('submits the selected provider and Ghana phone number', async () => {
    const setupButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Set Up Mobile Money'),
    );
    await act(async () => setupButton?.click());

    const provider = container.querySelector<HTMLSelectElement>('#mobile-money-provider');
    const number = container.querySelector<HTMLInputElement>('#mobile-money-number');
    const form = container.querySelector<HTMLFormElement>('#mobile-money-form');

    await act(async () => {
      if (provider) {
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set?.call(
          provider,
          'vodafone',
        );
        provider.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (number) {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(
          number,
          '0201234567',
        );
        number.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await act(async () => form?.requestSubmit());

    expect(mocks.updateMobileMoneyDetails).toHaveBeenCalledWith('0201234567', 'vodafone');
  });
});
