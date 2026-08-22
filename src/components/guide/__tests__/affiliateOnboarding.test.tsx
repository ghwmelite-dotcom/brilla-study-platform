// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AffiliateOnboardingSpotlight } from '../AffiliateOnboardingSpotlight';
import { getOnboardingStepsForRole } from '@/data/guides';
import type { AffiliateProfile } from '@/types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const profile: AffiliateProfile = {
  id: 'affiliate-1',
  userId: 'student-1',
  referralCode: 'AMA123XY',
  referralLink: 'https://brillaprep.org/ref/AMA123XY',
  tier: {
    id: 'tier_scout',
    name: 'scout',
    title: 'Scout',
    minReferrals: 0,
    maxReferrals: 5,
    commissionRate: 0.25,
    badgeIcon: 'scout',
    badgeColor: 'primary',
    xpBonus: 0,
    perks: ['Basic referral tracking', 'Monthly payouts'],
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
  joinedAt: '2026-08-22T10:00:00.000Z',
};

describe('affiliate onboarding', () => {
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

  it('adds the Scout chapter only to student onboarding', () => {
    expect(getOnboardingStepsForRole('student').map((step) => step.id)).toContain('share-brilla');
    expect(getOnboardingStepsForRole('teacher').map((step) => step.id)).not.toContain('share-brilla');
    expect(getOnboardingStepsForRole('parent').map((step) => step.id)).not.toContain('share-brilla');
  });

  it('shows verified Scout benefits and copies the personal referral link', async () => {
    const onExplore = vi.fn();
    await act(async () => {
      root.render(createElement(AffiliateOnboardingSpotlight, {
        profile,
        isLoading: false,
        onExplore,
      }));
    });

    expect(container.textContent).toContain('25% starting rate');
    expect(container.textContent).toContain('100 reward points');
    expect(container.textContent).toContain('AMA123XY');

    const copyButton = container.querySelector<HTMLButtonElement>('button[aria-label="Copy referral link"]');
    expect(copyButton).toBeTruthy();

    await act(async () => copyButton?.click());

    expect(writeText).toHaveBeenCalledWith(profile.referralLink);
    expect(container.textContent).toContain('Copied');
  });

  it('keeps navigation available when the protected profile is temporarily unavailable', async () => {
    const onExplore = vi.fn();
    await act(async () => {
      root.render(createElement(AffiliateOnboardingSpotlight, {
        profile: null,
        isLoading: false,
        onExplore,
      }));
    });

    expect(container.textContent).toContain('Your link is available in the Affiliate hub.');
    const explore = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Explore Affiliate hub'),
    );
    await act(async () => explore?.click());
    expect(onExplore).toHaveBeenCalledOnce();
  });
});
