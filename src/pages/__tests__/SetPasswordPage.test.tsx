// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  verifyEmail: vi.fn(),
  setPassword: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    verifyToken: mocks.verifyToken,
    verifyEmail: mocks.verifyEmail,
    setPassword: mocks.setPassword,
  },
}));

vi.mock('@/hooks/useTurnstile', () => ({
  useTurnstile: () => ({
    isVerified: true,
    token: 'turnstile-token',
    handleVerify: vi.fn(),
    handleError: vi.fn(),
    handleExpire: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock('@/components/common/Turnstile', () => ({
  Turnstile: () => <div data-testid="turnstile" />,
}));

vi.mock('@/utils', () => ({
  cn: (...values: Array<string | false | null | undefined>) =>
    values.filter(Boolean).join(' '),
}));

import { SetPasswordPage } from '../SetPasswordPage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('SetPasswordPage email verification reward', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.verifyToken.mockReset().mockResolvedValue({
      success: true,
      data: { name: 'New Student', email: 'student@example.com' },
    });
    mocks.verifyEmail.mockReset().mockResolvedValue({
      success: true,
      data: { message: 'Email verified successfully.', xpAwarded: 100 },
    });
    mocks.setPassword.mockReset();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('shows the incentive and celebrates the server-confirmed XP award', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/set-password?mode=verify-email&token=verify-token']}>
          <Routes>
            <Route path="/set-password" element={<SetPasswordPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Earn 100 XP');
    const verifyButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Verify Email & Earn 100 XP'),
    );
    expect(verifyButton).toBeDefined();

    await act(async () => {
      verifyButton?.click();
    });

    expect(mocks.verifyEmail).toHaveBeenCalledWith('verify-token', 'turnstile-token');
    expect(container.textContent).toContain('Email Verified!');
    expect(container.textContent).toContain('+100 XP earned');
  });
});
