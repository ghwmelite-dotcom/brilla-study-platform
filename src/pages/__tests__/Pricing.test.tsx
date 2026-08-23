// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Pricing from '../Pricing';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mocks = vi.hoisted(() => ({
  fetchPlans: vi.fn(async () => undefined),
  fetchStatus: vi.fn(async () => undefined),
  startTrial: vi.fn(async () => true),
  initializePayment: vi.fn(async () => null),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'student_1', role: 'student' },
    isAuthenticated: true,
  }),
}));

vi.mock('@/stores/subscriptionStore', () => ({
  useSubscriptionStore: () => ({
    plans: [
      {
        id: 'tier_student_yearly',
        name: 'Student Yearly',
        description: 'Full access for students - yearly billing (save 20%)',
        userType: 'student',
        priceMonthly: null,
        priceYearly: 480,
        features: ['unlimited_questions'],
        aiGradingQuota: -1,
        isActive: true,
      },
      {
        id: 'tier_student_monthly',
        name: 'Student Monthly',
        description: 'Full access for students - monthly billing',
        userType: 'student',
        priceMonthly: 50,
        priceYearly: null,
        features: ['unlimited_questions'],
        aiGradingQuota: 50,
        isActive: true,
      },
    ],
    subscriptionStatus: { status: 'free' },
    trialStatus: null,
    fetchPlans: mocks.fetchPlans,
    fetchStatus: mocks.fetchStatus,
    startTrial: mocks.startTrial,
    initializePayment: mocks.initializePayment,
  }),
}));

describe('Pricing', () => {
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
          <Pricing />
        </MemoryRouter>,
      );
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('shows each premium product at its configured non-zero price and billing cycle', () => {
    expect(container.textContent).toContain('480');
    expect(container.textContent).toContain('/year');
    expect(container.textContent).toContain('50');
    expect(container.textContent).toContain('/month');
  });

  it('checks out the yearly product using its own yearly billing cycle', async () => {
    const buttons = Array.from(container.querySelectorAll('button')).filter(
      (button) => button.textContent?.includes('Get Started'),
    );

    await act(async () => buttons[0]?.click());

    expect(mocks.initializePayment).toHaveBeenCalledWith('tier_student_yearly', 'yearly');
  });

  it('checks out the monthly product using its own monthly billing cycle', async () => {
    const buttons = Array.from(container.querySelectorAll('button')).filter(
      (button) => button.textContent?.includes('Get Started'),
    );

    await act(async () => buttons[1]?.click());

    expect(mocks.initializePayment).toHaveBeenCalledWith('tier_student_monthly', 'monthly');
  });
});
