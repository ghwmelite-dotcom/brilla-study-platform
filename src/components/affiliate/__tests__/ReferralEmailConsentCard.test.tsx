// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { ReferralEmailConsentCard } from '../ReferralEmailConsentCard';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const preference = {
  referralRewardsOptIn: false,
  consentVersion: null,
  consentedAt: null,
  providerSyncStatus: 'not_synced',
  emailVerified: true,
  consentCopyVersion: 'referral-rewards-2026-08-29',
};

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('ReferralEmailConsentCard', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.mocked(api.get).mockResolvedValue({ success: true, data: preference });
    vi.mocked(api.put).mockReset();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it('keeps student consent optional and saves an explicit unchecked-by-default opt-in', async () => {
    vi.mocked(api.put).mockResolvedValue({
      success: true,
      data: { referralRewardsOptIn: true, providerSyncStatus: 'synced' },
    });

    await act(async () => {
      root.render(createElement(ReferralEmailConsentCard, { surface: 'student_onboarding' }));
    });
    await flushEffects();

    const optIn = container.querySelector<HTMLInputElement>(
      'input[aria-label="Email me Scout referral ideas and reward updates"]',
    );
    expect(optIn?.checked).toBe(false);

    await act(async () => optIn?.click());
    const save = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Save email choice'),
    );
    expect(save?.hasAttribute('disabled')).toBe(false);

    await act(async () => save?.click());
    await flushEffects();

    expect(api.put).toHaveBeenCalledWith('/marketing/preferences', {
      referralRewardsOptIn: true,
      consentSource: 'student_onboarding',
    });
    expect(container.textContent).toContain('You will now receive occasional Scout referral and reward updates.');
  });

  it('allows a previously opted-in student to switch marketing email off', async () => {
    vi.mocked(api.get).mockResolvedValue({
      success: true,
      data: {
        ...preference,
        referralRewardsOptIn: true,
        providerSyncStatus: 'synced',
      },
    });
    vi.mocked(api.put).mockResolvedValue({
      success: true,
      data: { referralRewardsOptIn: false, providerSyncStatus: 'suppressed' },
    });

    await act(async () => {
      root.render(createElement(ReferralEmailConsentCard, { surface: 'affiliate_dashboard' }));
    });
    await flushEffects();

    const optIn = container.querySelector<HTMLInputElement>(
      'input[aria-label="Email me Scout referral ideas and reward updates"]',
    );
    await act(async () => optIn?.click());
    const save = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Save email choice'),
    );
    await act(async () => save?.click());
    await flushEffects();

    expect(api.put).toHaveBeenCalledWith('/marketing/preferences', {
      referralRewardsOptIn: false,
      consentSource: 'affiliate_dashboard',
    });
    expect(container.textContent).toContain('Referral and reward marketing emails are now off.');
  });

  it('does not allow opt-in before email verification', async () => {
    vi.mocked(api.get).mockResolvedValue({
      success: true,
      data: { ...preference, emailVerified: false },
    });

    await act(async () => {
      root.render(createElement(ReferralEmailConsentCard, { surface: 'affiliate_dashboard' }));
    });
    await flushEffects();

    const optIn = container.querySelector<HTMLInputElement>(
      'input[aria-label="Email me Scout referral ideas and reward updates"]',
    );
    expect(optIn?.disabled).toBe(true);
    expect(container.textContent).toContain('Confirm your email address before choosing referral emails.');
  });

  it('keeps the choice visible when saving fails so the student can retry', async () => {
    vi.mocked(api.put).mockResolvedValue({
      success: false,
      error: 'Email provider is temporarily unavailable',
    });

    await act(async () => {
      root.render(createElement(ReferralEmailConsentCard, { surface: 'affiliate_dashboard' }));
    });
    await flushEffects();

    const optIn = container.querySelector<HTMLInputElement>(
      'input[aria-label="Email me Scout referral ideas and reward updates"]',
    );
    await act(async () => optIn?.click());
    const save = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Save email choice'),
    );
    await act(async () => save?.click());
    await flushEffects();

    expect(container.textContent).toContain('Email provider is temporarily unavailable');
    expect(container.querySelector(
      'input[aria-label="Email me Scout referral ideas and reward updates"]',
    )).toBeTruthy();
    expect(save?.hasAttribute('disabled')).toBe(false);
  });
});
