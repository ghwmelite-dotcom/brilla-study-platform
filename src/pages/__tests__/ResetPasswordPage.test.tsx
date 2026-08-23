// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  resetPassword: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: { resetPassword: mocks.resetPassword },
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

import { ResetPasswordPage } from '../ResetPasswordPage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('ResetPasswordPage', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.resetPassword.mockReset().mockResolvedValue({
      success: true,
      data: { message: 'Password reset successfully.' },
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('uses the emailed reset token and confirms a successful password change', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/reset-password?token=reset-token']}>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Reset Your Password');
    const password = container.querySelector<HTMLInputElement>('input[name="password"]');
    const confirmation = container.querySelector<HTMLInputElement>('input[name="confirmPassword"]');
    expect(password).not.toBeNull();
    expect(confirmation).not.toBeNull();

    await act(async () => {
      setInputValue(password!, 'N3wSecurePassword1');
      setInputValue(confirmation!, 'N3wSecurePassword1');
    });

    const submit = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Reset Password'),
    );
    expect(submit).toBeDefined();

    await act(async () => {
      submit?.click();
    });

    expect(mocks.resetPassword).toHaveBeenCalledWith(
      'reset-token',
      'N3wSecurePassword1',
      'turnstile-token',
    );
    expect(container.textContent).toContain('Password Reset Successfully');
  });
});
